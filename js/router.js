/* router.js: every screen has its own address (#/pantry, #/meals/recipe/pasta, ...).
   - Browser Back/Forward and Refresh work.
   - Each tab remembers its last screen, like Output C's per-tab stacks.
   - The in-app Back button returns to the previous screen of the same tab, or its parent.
   - Leaving a form with unsaved changes (in-app Back, Cancel or browser Back) asks first. */
"use strict";

const TABS = [["pantry","Pantry"],["meals","Meals"],["grocery","Grocery list"],["profile","Profile"]];
const SCREENS = {};
const VS = {};                                   // view state per address (drafts, errors, scroll)
const tabLast = {pantry:"#/pantry", meals:"#/meals", grocery:"#/grocery", profile:"#/profile"};
let CUR = null;                                  // {key, route}
let HIST = {idx:0, entries:[]};                  // mirror of this tab's history, for the in-app Back button
let internalPop = false, pendingAfter = null;

function parseRoute(key){
  const [a,b,c,x]=(key||"").replace(/^#\/?/,"").split("/").filter(Boolean);
  if(x) return null;
  if(a==="pantry"&&!b) return {tab:"pantry",s:"pantry"};
  if(a==="pantry"&&b==="add"&&!c) return {tab:"pantry",s:"form",mode:"add"};
  if(a==="pantry"&&b==="item"&&/^\d+$/.test(c||"")) return {tab:"pantry",s:"form",mode:"edit",id:+c};
  if(a==="meals"&&!b) return {tab:"meals",s:"meals"};
  if(a==="meals"&&b==="search"&&!c) return {tab:"meals",s:"search"};
  if(a==="meals"&&b==="recipe"&&c) return {tab:"meals",s:"detail",id:c};
  if(a==="grocery"&&!b) return {tab:"grocery",s:"grocery"};
  if(a==="profile"&&!b) return {tab:"profile",s:"profile"};
  if(a==="profile"&&b==="edit"&&!c) return {tab:"profile",s:"editProfile"};
  return null;
}
const depthOf = key => key.replace(/^#\/?/,"").split("/").filter(Boolean).length;
const tabOf = key => key.replace(/^#\/?/,"").split("/")[0];
const parentOf = key => "#/"+tabOf(key);
function vs(key){ return VS[key]||(VS[key]={}); }
function isDirty(key){ const e=VS[key]; return !!(e&&e.draft&&e.orig&&JSON.stringify(e.draft)!==JSON.stringify(e.orig)); }

function saveHist(){ try{ sessionStorage.setItem("mpa.v1.hist",JSON.stringify(HIST.entries)); }catch(e){} }
function loadHist(){ try{ return JSON.parse(sessionStorage.getItem("mpa.v1.hist"))||[]; }catch(e){ return []; } }
function saveScroll(){ if(CUR) vs(CUR.key).scroll=$("#main").scrollTop; }
function leaving(){ saveScroll(); clearToast(); closeDialog(); }

/* Go forward to a screen. fresh: start with an empty view state (e.g. a new Add form). */
function go(key, opt={}){
  leaving();
  if(opt.fresh) delete VS[key];
  HIST.idx++; HIST.entries=HIST.entries.slice(0,HIST.idx); HIST.entries.push(key); saveHist();
  history.pushState({idx:HIST.idx},"",key);
  show(key,true);
  if(opt.after) opt.after();
}
/* In-app Back: previous screen of the same tab if it is the one before in history, else the parent. */
function back(after){
  saveState();
  const cur=CUR.key, prev=HIST.entries[HIST.idx-1];
  if(prev && tabOf(prev)===tabOf(cur) && depthOf(prev)<depthOf(cur)){
    leaving(); internalPop=true; pendingAfter=after||null; history.back(); return;
  }
  go(parentOf(cur),{after});
}
function switchTab(t){
  if(CUR.route.tab===t){ leaving(); render(true); return; }
  go(tabLast[t]);
}

window.addEventListener("popstate", ev=>{
  const key=location.hash||"#/pantry";
  const st=ev.state;
  if(!internalPop && CUR && key!==CUR.key && isDirty(CUR.key)){
    /* Browser Back/Forward from a form with unsaved changes: put the form back and ask. */
    const formKey=CUR.key, idx=(st&&typeof st.idx==="number")?st.idx:HIST.idx;
    HIST.idx=idx+1; HIST.entries=HIST.entries.slice(0,HIST.idx); HIST.entries[idx]=key; HIST.entries.push(formKey); saveHist();
    history.pushState({idx:HIST.idx},"",formKey);
    askDiscard(formKey, ()=>{ delete VS[formKey]; leaving(); internalPop=true; history.back(); });
    return;
  }
  internalPop=false;
  if(st&&typeof st.idx==="number"){ HIST.idx=st.idx; HIST.entries[st.idx]=key; }
  else { /* address typed by hand */ HIST.idx++; HIST.entries=HIST.entries.slice(0,HIST.idx); HIST.entries.push(key); history.replaceState({idx:HIST.idx},"",key); }
  saveHist();
  leaving();
  show(key,true);
  if(pendingAfter){ const f=pendingAfter; pendingAfter=null; f(); }
});
window.addEventListener("beforeunload", ev=>{ if(CUR&&isDirty(CUR.key)){ ev.preventDefault(); ev.returnValue=""; } });

function askDiscard(key, onDiscard){
  const e=VS[key]; const isProfile=parseRoute(key).s==="editProfile";
  const body=isProfile?"Your changes to your profile will not be saved.":`Your changes to ${(e.draft.name||"").trim()||"this ingredient"} will not be saved.`;
  dialog("Discard your changes?", body, [["Keep editing",null,"btn-primary"],["Discard changes",onDiscard,"btn-danger"]]);
}

function show(key, focusTitle){
  let route=parseRoute(key);
  if(!route){ key="#/pantry"; route=parseRoute(key); HIST.entries[HIST.idx]=key; saveHist(); history.replaceState({idx:HIST.idx},"",key); }
  CUR={key,route}; tabLast[route.tab]=key;
  render(focusTitle);
}
function render(focusTitle){
  document.documentElement.style.setProperty("--scale", S.profile.scale);
  const {key,route}=CUR; const e=vs(key);
  const out=SCREENS[route.s](route,e,key);
  const sub=depthOf(key)>1;
  $("#hdr").className=sub?"sub":"";
  $("#hdr").innerHTML=`<div class="wrap">`+(sub?`<button type="button" class="back" id="backbtn">${I.back}Back</button>`:"")+`<h1 id="title" tabindex="-1">${esc(out.title)}</h1></div>`;
  if(sub) $("#backbtn").onclick=()=>out.onBack?out.onBack():back();
  $("#content").innerHTML=out.html;
  $("#tabbar").innerHTML=`<div class="wrap">`+TABS.map(([k,l])=>`<button type="button" class="tab" data-tab="${k}" ${route.tab===k?'aria-current="page"':""}>${I[k]}<span>${l}</span></button>`).join("")+`</div>`;
  $$("#tabbar [data-tab]").forEach(b=>b.onclick=()=>switchTab(b.dataset.tab));
  document.title=out.title+" – Meal Planning Assistant";
  if(out.bind) out.bind();
  $("#main").scrollTop=e.scroll||0;
  if(focusTitle) $("#title").focus();
  saveState();
}
function rerender(){ saveScroll(); render(false); }

function startRouter(){
  const key=location.hash&&parseRoute(location.hash)?location.hash:"#/pantry";
  const st=history.state;
  if(st&&typeof st.idx==="number"){ HIST.entries=loadHist(); HIST.idx=st.idx; }
  else { HIST.entries=[]; HIST.idx=0; }
  HIST.entries[HIST.idx]=key; saveHist();
  history.replaceState({idx:HIST.idx},"",key);
  show(key,false);
}

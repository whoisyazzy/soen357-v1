/* screens-meals.js: T2 Select a suitable meal (Figure 5.2) and the start of T3 (Figure 5.3).
   Meals (suggestions + filters), Search recipes, Meal detail, add missing items. */
"use strict";

function ctx(){ return {pantry:S.pantry, servings:S.filters.servings, maxTime:S.filters.maxTime, allergies:S.profile.allergies, rejected:S.rejected, today:getToday()}; }
function analyseR(r){ return analyse(r,S.pantry,S.filters.servings,getToday()); }
function blocked(r){ return blockedBy(r,S.profile.allergies); }
function hiddenNote(list){
  const hidden=list.filter(r=>blocked(r).length);
  if(!hidden.length) return "";
  const al=[...new Set(hidden.flatMap(blocked))].map(a=>a.toLowerCase()).join(", ");
  return noteHTML(`${hidden.length} recipe${hidden.length>1?"s":""} hidden: contain${hidden.length>1?"":"s"} ${al}`);
}
const LIMITS = noteHTML("Suggestions are sample matches based on your pantry. Always check product labels for allergens.");

function mealCard({r,a}){
  const sel=S.selected.includes(r.id);
  const uses=a.uses.length?a.uses.map(l=>esc(l.n)+(a.soon.includes(l)?" (Use soon)":"")).join(", "):"No pantry items";
  return `<li><button type="button" class="card" data-meal="${r.id}"><span class="top"><span class="title">${esc(r.name)}</span>${I.chev}</span>
   <span class="uses">Uses: ${uses}</span>
   <span class="facts"><span>${a.missing.length} missing</span><span>${r.time} min</span><span>${esc(r.difficulty)}</span>${sel?`<span class="badge b-sel">${I.check}Selected</span>`:""}</span></button></li>`;
}

SCREENS.meals = (r, e) => {
  const sug=rankSuggestions(RECIPES,ctx()), F=S.filters, allg=S.profile.allergies;
  let h=`<div class="chips" aria-label="Filters">
    <button type="button" class="fchip" id="c-serv" aria-expanded="${e.ed==="serv"}">Servings: ${F.servings}</button>
    <button type="button" class="fchip" id="c-time" aria-expanded="${e.ed==="time"}">Max time: ${F.maxTime==="Any"?"Any":F.maxTime+" min"}</button>
    <button type="button" class="fchip locked" id="c-all" aria-expanded="${e.ed==="all"}">${I.lock}${allg.length?"No "+esc(allg.map(a=>a.toLowerCase()).join(", "))+" (from Profile)":"No allergies set (Profile)"}</button></div>`;
  if(e.ed==="serv") h+=`<div class="inline-ed"><label class="flabel" for="sv">Servings</label><div class="stepper"><button type="button" id="svm" aria-label="Fewer servings">−</button><input class="input" id="sv" inputmode="numeric" value="${esc(e.svDraft??F.servings)}" ${e.svErr?'aria-invalid="true" aria-describedby="sv-err"':""}><button type="button" id="svp" aria-label="More servings">+</button></div>${errHTML("sv",e.svErr)}<div class="btn-row"><button type="button" class="btn btn-secondary" id="svc">Cancel</button><button type="button" class="btn btn-primary" id="sva">Apply</button></div></div>`;
  if(e.ed==="time") h+=`<div class="inline-ed"><fieldset class="flush"><legend class="flabel">Maximum time</legend><div class="chips">${MAX_TIMES.map(t=>`<label class="chip"><input type="radio" name="mt" value="${t}" ${F.maxTime===t?"checked":""}><span>${t==="Any"?"Any":t+" min"}</span></label>`).join("")}</div></fieldset></div>`;
  if(e.ed==="all") h+=`<div class="inline-ed"><p class="flush-p">Allergies are set in your Profile and always applied, including in search.</p><button type="button" class="btn btn-secondary" id="toProf">Change allergies in Profile</button></div>`;
  h+=hiddenNote(RECIPES.filter(x=>!S.rejected.includes(x.id)));
  h+=`<button type="button" class="row searchrow" id="toSearch">${I.search}<span class="grow">Search recipes</span></button>`;
  if(!sug.length) h+=`<div class="empty">${I.empty}<p>No meals match. Change Servings or Max time, or search recipes.</p><button type="button" class="btn btn-primary" id="emSearch">Search recipes</button></div>`;
  else h+=`<h2>Suggested for you</h2><ul class="list cards">${sug.map(mealCard).join("")}</ul>`;
  if(S.rejected.length) h+=`<p class="muted rejline">${S.rejected.length} suggestion${S.rejected.length>1?"s":""} hidden by you. <button type="button" class="linkbtn" id="showRej">Show again</button></p>`;
  h+=LIMITS;
  return {title:"Meals", html:h, bind:()=>{
    const tog=k=>{ e.ed=e.ed===k?null:k; e.svErr=null; e.svDraft=null; rerender(); $("#c-"+k).focus(); };
    $("#c-serv").onclick=()=>tog("serv"); $("#c-time").onclick=()=>tog("time"); $("#c-all").onclick=()=>tog("all");
    if($("#sv")){
      const st=k=>{ const v=parseInt($("#sv").value,10); $("#sv").value=isNaN(v)?2:v+k; };
      $("#svm").onclick=()=>st(-1); $("#svp").onclick=()=>st(1);
      $("#svc").onclick=()=>{ e.ed=null; rerender(); $("#c-serv").focus(); };
      $("#sva").onclick=()=>{ const raw=$("#sv").value.trim(), err=servingsError(raw);
        if(err){ e.svErr=err; e.svDraft=raw; rerender(); $("#sv").focus(); return; }
        F.servings=Number(raw); e.ed=null; e.svErr=null; e.svDraft=null; rerender(); $("#c-serv").focus(); };
    }
    $$("input[name=mt]").forEach(x=>x.onchange=()=>{ F.maxTime=x.value==="Any"?"Any":+x.value; rerender(); document.querySelector("input[name=mt]:checked").focus(); });
    if($("#toProf")) $("#toProf").onclick=()=>{ e.ed=null; go("#/profile/edit",{fresh:true}); };
    $("#toSearch").onclick=()=>go("#/meals/search",{fresh:true});
    if($("#emSearch")) $("#emSearch").onclick=()=>go("#/meals/search",{fresh:true});
    if($("#showRej")) $("#showRej").onclick=()=>{ const prev=[...S.rejected]; S.rejected=[]; rerender(); toast("Hidden suggestions shown again",[["Undo",()=>{ S.rejected=prev; rerender(); }]]); };
    $$("[data-meal]").forEach(b=>b.onclick=()=>go("#/meals/recipe/"+b.dataset.meal,{fresh:true}));
  }};
};

/* ---------- Search ---------- */
SCREENS.search = (r, e) => {
  const q=(e.q||"").trim().toLowerCase();
  const match=x=>!q||x.name.toLowerCase().includes(q)||x.ing.some(i=>i[0].toLowerCase().includes(q));
  const all=RECIPES.filter(match), vis=all.filter(x=>blocked(x).length===0);
  let res=hiddenNote(all);
  if(!vis.length) res+=`<div class="empty">${I.empty}<p>No recipes found. Try a different ingredient.</p></div>`;
  else res+=`<h2>${vis.length} recipe${vis.length>1?"s":""}</h2><ul class="list cards">${vis.map(x=>mealCard({r:x,a:analyseR(x)})).join("")}</ul>`;
  const h=`<div class="field"><label for="sq">Search by recipe or ingredient</label><input class="input" id="sq" type="search" value="${esc(e.q||"")}" autocomplete="off"></div><div id="sres" aria-live="polite">${res}</div><p class="help">Search shows all recipes, including ones over your maximum time. Your allergy filter still applies.</p>`;
  return {title:"Search recipes", html:h, bind:()=>{
    const inp=$("#sq");
    inp.oninput=()=>{ e.q=inp.value; const pos=inp.selectionStart; rerender(); const n=$("#sq"); n.focus(); n.setSelectionRange(pos,pos); };
    $$("[data-meal]").forEach(b=>b.onclick=()=>go("#/meals/recipe/"+b.dataset.meal,{fresh:true}));
  }};
};

/* ---------- Meal detail ---------- */
function addMissing(rc){
  const a=analyseR(rc); const added=[];
  for(const l of a.missing){
    if(findByName(S.grocery,l.n)) continue;
    const g={id:S.gNext++,name:l.n,qty:round2(l.q),unit:l.u,src:rc.name,done:false}; S.grocery.push(g); added.push(g);
  }
  if(!added.length){
    const names=a.missing.map(l=>l.n).join(", ");
    dialog("Already on your list", `${names} ${a.missing.length>1?"are":"is"} already on your grocery list. Nothing was added twice.`, [["View grocery list",()=>switchTab("grocery"),"btn-primary"],["OK",null,"btn-secondary"]]);
    return;
  }
  rerender();
  toast(`${added.length} item${added.length>1?"s":""} added to grocery list`,[["View grocery list",()=>switchTab("grocery")],["Undo",()=>{ S.grocery=S.grocery.filter(g=>!added.includes(g)); rerender(); toast("Items removed from grocery list"); }]]);
}

SCREENS.detail = (r, e) => {
  const rc=RECIPES.find(x=>x.id===r.id);
  if(!rc) return notFound("Meal detail","This recipe was not found.","Go to Meals","#/meals");
  const a=analyseR(rc), sel=S.selected.includes(rc.id), bl=blocked(rc), mt=S.filters.maxTime, sv=S.filters.servings, today=getToday();
  const why=[];
  if(a.soon.length) why.push("Uses "+a.soon.map(l=>{ const st=dateStatus(l.p,today); return `${l.n} (Use soon · ${DLABEL[l.p.dtype]} ${fmtD(st.dt)})`; }).join(", "));
  const other=a.uses.filter(l=>!a.soon.includes(l)); if(other.length) why.push("Also uses "+other.map(l=>l.n).join(", ")+" from your pantry");
  why.push(mt==="Any"?`Takes ${rc.time} min`:(rc.time<=mt?`Fits your ${mt} min maximum (${rc.time} min)`:`Takes ${rc.time} min, more than your ${mt} min maximum`));
  why.push(`Quantities shown for ${sv} serving${sv>1?"s":""}`);
  why.push(S.profile.allergies.length?(bl.length?`Contains ${bl.join(", ").toLowerCase()}, which is in your allergies`:`Checked against your allergies (${S.profile.allergies.join(", ").toLowerCase()}): not listed in this sample recipe`):"No allergies set in your Profile");
  const n=a.missing.length;
  let h=`<h2 class="dtitle">${esc(rc.name)}</h2><p class="sub-text flush-p">${rc.time} min · ${sv} servings · ${esc(rc.difficulty)}</p>
   ${sel?`<p class="selline"><span class="badge b-sel">${I.check}Selected</span></p>`:""}
   <div class="dgrid">
   <section class="panel" aria-labelledby="why-h"><h2 id="why-h">Why this meal</h2><ul>${why.map(w=>`<li>${esc(w)}</li>`).join("")}</ul></section>
   <section class="panel" aria-labelledby="ing-h"><h2 id="ing-h">Ingredients</h2><ul class="ing">${a.lines.map(l=>`<li><span>${esc(l.n)} · ${qtyU(l.q,l.u)}</span>${l.have?`<span class="badge b-have">${I.check}Have</span>`:`<span class="badge b-miss">${I.plus}Missing</span>`}</li>`).join("")}</ul></section>
   </div>
   <section class="panel" aria-labelledby="st-h"><h2 id="st-h">Steps</h2><ol class="steps">${rc.steps.map(s=>`<li>${esc(s)}</li>`).join("")}</ol></section>
   ${noteHTML("Sample match. Check product labels for allergens.")}`;
  if(sel) h+=`<div class="stack">${n?`<button type="button" class="btn btn-primary btn-block" id="addMiss">Add ${n} missing item${n>1?"s":""} to grocery list</button>`:`<p class="muted flush-p">All ingredients are available.</p>`}<button type="button" class="btn btn-secondary btn-block" id="unsel">Unselect meal</button></div>`;
  else if(!bl.length) h+=`<div class="btn-row"><button type="button" class="btn btn-secondary" id="rej">Reject</button><button type="button" class="btn btn-primary" id="selm">Select this meal</button></div>`;
  return {title:"Meal detail", html:h, bind:()=>{
    if($("#selm")) $("#selm").onclick=()=>{
      if(!S.selected.includes(rc.id)) S.selected.push(rc.id); rerender();
      if(!n) dialog("Meal selected", `${rc.name} selected. All ingredients are available.`, [["OK",null,"btn-primary"]]);
      else dialog("Meal selected", `${rc.name} selected. ${n} ingredient${n>1?"s are":" is"} missing.`, [[`Add ${n} missing item${n>1?"s":""} to grocery list`,()=>addMissing(rc),"btn-primary"],["Not now",null,"btn-secondary"]]);
    };
    if($("#rej")) $("#rej").onclick=()=>{ S.rejected.push(rc.id); back(()=>toast("Suggestion hidden",[["Undo",()=>{ S.rejected=S.rejected.filter(x=>x!==rc.id); rerender(); toast("Suggestion restored"); }]])); };
    if($("#addMiss")) $("#addMiss").onclick=()=>addMissing(rc);
    if($("#unsel")) $("#unsel").onclick=()=>{ S.selected=S.selected.filter(x=>x!==rc.id); rerender(); $("#title").focus(); toast("Meal unselected. Its grocery items stay on your list.",[["Undo",()=>{ S.selected.push(rc.id); rerender(); }]]); };
  }};
};

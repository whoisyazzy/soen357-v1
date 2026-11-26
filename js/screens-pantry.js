/* screens-pantry.js: T1 Manage pantry (Output C Figure 5.1). Pantry list, Add / Edit ingredient form. */
"use strict";

function dateBadge(it){
  const st=dateStatus(it,getToday()); if(!st||st.k==="later") return "";
  const lab=DLABEL[it.dtype];
  if(st.k==="soon") return `<span class="badge b-soon">${I.clock}Use soon · ${lab} ${fmtD(st.dt)} (${rel(st.n)})</span>`;
  return `<span class="badge b-past">${I.cal}Past date · ${lab} ${fmtD(st.dt)}</span>`;
}
function pantryRow(it){
  const st=dateStatus(it,getToday());
  const meta=qtyU(it.qty,it.unit)+((st&&st.k!=="later")?" · "+it.loc:"")+((st&&st.k==="later")?" · "+DLABEL[it.dtype]+" "+fmtD(st.dt):"");
  return `<li><button type="button" class="row" data-open="${it.id}"><span class="grow"><span class="name">${esc(it.name)}</span><span class="meta">${esc(meta)}</span>${dateBadge(it)}</span>${I.chev}</button></li>`;
}
function todayLine(){ return `<p class="muted">Today${todayOverride()?" (test date)":""}: ${fmtLong(getToday())}</p>`; }

SCREENS.pantry = () => {
  const today=getToday();
  if(!S.pantry.length) return {title:"Pantry", html:`${todayLine()}<div class="empty">${I.empty}<p>Your pantry is empty.</p><button type="button" class="btn btn-primary" id="addI">Add ingredient</button></div>`,
    bind:()=>{ $("#addI").onclick=()=>go("#/pantry/add",{fresh:true}); }};
  const status=i=>{ const s=dateStatus(i,today); return s?s.k:null; };
  const soon=S.pantry.filter(i=>status(i)==="soon").sort((a,b)=>a.date.localeCompare(b.date));
  const past=S.pantry.filter(i=>status(i)==="past");
  const rest=S.pantry.filter(i=>!soon.includes(i)&&!past.includes(i));
  let h=`${todayLine()}<button type="button" class="btn btn-primary btn-block" id="addI">${I.plusBtn}Add ingredient</button>`;
  if(soon.length) h+=`<h2>Use soon</h2><ul class="list">${soon.map(pantryRow).join("")}</ul>`;
  if(past.length) h+=`<h2>Past date</h2><ul class="list">${past.map(pantryRow).join("")}</ul>`;
  for(const loc of LOCATIONS){
    const its=rest.filter(i=>i.loc===loc);
    h+=`<h2>${loc}</h2>`+(its.length?`<ul class="list">${its.map(pantryRow).join("")}</ul>`:`<p class="muted">No items</p>`);
  }
  return {title:"Pantry", html:h, bind:()=>{
    $("#addI").onclick=()=>go("#/pantry/add",{fresh:true});
    $$("[data-open]").forEach(b=>b.onclick=()=>go("#/pantry/item/"+b.dataset.open,{fresh:true}));
  }};
};

/* ---------- Add / edit ingredient ---------- */
function notFound(title,msg,btnLabel,target){
  return {title, html:`<div class="empty">${I.empty}<p>${esc(msg)}</p><button type="button" class="btn btn-primary" id="nfgo">${esc(btnLabel)}</button></div>`,
    bind:()=>{ $("#nfgo").onclick=()=>go(target); }};
}

SCREENS.form = (r, e, key) => {
  const add=r.mode==="add";
  const item=add?null:S.pantry.find(p=>p.id===r.id);
  if(!add&&!item&&!e.draft) return notFound("Ingredient","This ingredient is no longer in your pantry.","Go to Pantry","#/pantry");
  if(!e.draft){
    e.orig=item?{name:item.name,qty:String(item.qty),unit:item.unit,loc:item.loc,dtype:item.dtype,date:item.date}:{name:"",qty:"1",unit:"",loc:"",dtype:"None",date:""};
    e.draft={...e.orig}; e.errs={};
  }
  const d=e.draft, er=e.errs;
  const radio=(name,opts,val,lab)=>`<fieldset><legend>${lab}</legend><div class="chips" role="radiogroup">${opts.map(o=>`<label class="chip"><input type="radio" name="${name}" value="${esc(o)}" ${val===o?"checked":""} ${er[name]?'aria-invalid="true" aria-describedby="f-'+name+'-err"':""}><span>${esc(o==="Personal reminder"?"Reminder":o)}</span></label>`).join("")}</div>${errHTML("f-"+name,er[name])}</fieldset>`;
  const h=`<form id="ingf" novalidate>
   <div class="field"><label for="f-name">Name</label><input class="input" id="f-name" autocomplete="off" value="${esc(d.name)}" ${er.name?'aria-invalid="true" aria-describedby="f-name-err"':""}>${errHTML("f-name",er.name)}</div>
   <div class="field"><label for="f-qty">Quantity</label><div class="stepper"><button type="button" id="qm" aria-label="Decrease quantity">−</button><input class="input" id="f-qty" inputmode="decimal" value="${esc(d.qty)}" ${er.qty?'aria-invalid="true" aria-describedby="f-qty-err"':""}><button type="button" id="qp" aria-label="Increase quantity">+</button></div>${errHTML("f-qty",er.qty)}</div>
   <div class="field"><label for="f-unit">Unit</label><select class="input" id="f-unit" ${er.unit?'aria-invalid="true" aria-describedby="f-unit-err"':""}><option value="">Choose a unit</option>${UNITS.map(u=>`<option ${d.unit===u?"selected":""}>${u}</option>`).join("")}</select>${errHTML("f-unit",er.unit)}</div>
   ${radio("loc",LOCATIONS,d.loc,"Storage location")}
   ${radio("dtype",DATE_TYPES,d.dtype,"Date type")}
   <p class="help" id="dhelp">${esc(DHELP[d.dtype])}</p>
   ${d.dtype!=="None"?`<div class="field"><label for="f-date">Date</label><input type="date" class="input" id="f-date" value="${esc(d.date)}" ${er.date?'aria-invalid="true" aria-describedby="f-date-err"':""}><p class="help" id="f-date-read" aria-live="polite"></p>${errHTML("f-date",er.date)}</div>`:""}
   <div class="btn-row"><button type="button" class="btn btn-secondary" id="fcancel">Cancel</button><button type="submit" class="btn btn-primary" id="fsave">Save</button></div>
   ${add?"":`<div class="stack"><button type="button" class="btn btn-danger btn-block" id="fremove">Remove</button></div>`}
  </form>`;
  const leave=()=>{
    if(!isDirty(key)){ delete VS[key]; return back(); }
    askDiscard(key, ()=>{ delete VS[key]; back(); });
  };
  return {title:add?"Add ingredient":"Edit "+(e.orig.name||"ingredient"), html:h, onBack:leave, bind:()=>{
    const sync=()=>{ d.name=$("#f-name").value; d.qty=$("#f-qty").value; d.unit=$("#f-unit").value; const l=document.querySelector('input[name=loc]:checked'); d.loc=l?l.value:""; if($("#f-date")) d.date=$("#f-date").value; };
    const clr=f=>{ if(!er[f]) return; delete er[f]; const n=$("#f-"+f+"-err"); if(n) n.remove();
      $$(f==="loc"?"input[name=loc]":"#f-"+f).forEach(x=>{x.removeAttribute("aria-invalid");x.removeAttribute("aria-describedby");}); };
    const fieldOf=t=>t.name==="loc"?"loc":(t.id||"").replace("f-","");
    const showRead=()=>{ const rd=$("#f-date-read"); if(!rd) return; const dt=parseD($("#f-date").value); rd.textContent=dt?"Reads as: "+fmtLong(dt)+" ("+rel(daysFrom(getToday(),dt))+")":""; };
    $("#ingf").addEventListener("input",ev=>{ sync(); clr(fieldOf(ev.target)); if(ev.target.id==="f-date") showRead(); });
    $("#ingf").addEventListener("change",ev=>{ sync(); clr(fieldOf(ev.target));
      if(ev.target.name==="dtype"){ d.dtype=ev.target.value; if(d.dtype==="None") d.date=""; delete er.dtype; delete er.date; rerender(); document.querySelector('input[name=dtype]:checked').focus(); } });
    showRead();
    const step=k=>{ sync(); clr("qty"); d.qty=stepIngredient(d.qty,k); $("#f-qty").value=d.qty; };
    $("#qm").onclick=()=>step(-1); $("#qp").onclick=()=>step(1);
    $("#fcancel").onclick=leave;
    if($("#fremove")) $("#fremove").onclick=()=>{
      const idx=S.pantry.findIndex(p=>p.id===r.id); const it=S.pantry[idx];
      S.pantry.splice(idx,1); delete VS[key];
      back(()=>toast(`${it.name} removed`,[["Undo",()=>{ S.pantry.splice(idx,0,it); rerender(); toast(`${it.name} restored`); }]]));
    };
    $("#ingf").onsubmit=ev=>{ ev.preventDefault(); sync(); submitIng(r,e,key); };
  }};
};

function submitIng(r,e,key){
  if(e.done) return;
  const d=e.draft, er=validateIngredient(d);
  e.errs=er;
  if(Object.keys(er).length){
    rerender();
    const first=["f-name","f-qty","f-unit"].find(id=>er[id.slice(2)]);
    const el=first?$("#"+first):(er.loc?document.querySelector("input[name=loc]"):er.date?$("#f-date"):null);
    if(el) el.focus(); return;
  }
  const name=d.name.trim();
  const item={name,qty:parseQty(d.qty),unit:d.unit,loc:d.loc,dtype:d.dtype,date:d.dtype==="None"?"":d.date};
  const checks=[];
  if(r.mode==="add"&&findByName(S.pantry,name)) checks.push("dup");
  const dt=item.date?parseD(item.date):null;
  if(dt&&daysFrom(getToday(),dt)<0&&(r.mode==="add"||item.date!==e.orig.date)) checks.push("past");
  if(dt&&daysFrom(getToday(),dt)>365*5) checks.push("far");
  runChecks(r,e,key,item,checks);
}
function runChecks(r,e,key,item,checks){
  if(!checks.length) return commit(r,e,key,item);
  const c=checks[0], rest=checks.slice(1);
  const focusDate=()=>{ const f=$("#f-date"); if(f) f.focus(); };
  if(c==="dup"){
    const ex=findByName(S.pantry,item.name), same=ex.unit===item.unit;
    const btns=[]; if(same) btns.push(["Add to existing",()=>commit(r,e,key,item,ex),"btn-primary"]);
    btns.push(["Keep as separate item",()=>runChecks(r,e,key,item,rest),same?"btn-secondary":"btn-primary"]); btns.push(["Cancel",null,"btn-secondary"]);
    dialog("Already in your pantry", `${ex.name} is already in your pantry (${qtyU(ex.qty,ex.unit)}, ${ex.loc}).`+(same?"":" The units are different, so it can only be kept as a separate item."), btns);
  } else if(c==="past"){
    dialog("Check the date","This date has passed. Check it, or save the item with a Past date label.",[["Change date",focusDate,"btn-primary"],["Save anyway",()=>runChecks(r,e,key,item,rest),"btn-secondary"]]);
  } else if(c==="far"){
    dialog("Check the date","Check the date: it is more than 5 years away.",[["Change date",focusDate,"btn-primary"],["Save anyway",()=>runChecks(r,e,key,item,rest),"btn-secondary"]]);
  }
}
function commit(r,e,key,item,mergeTarget){
  if(e.done) return; e.done=true; delete VS[key];
  if(mergeTarget){
    const before={...mergeTarget}; Object.assign(mergeTarget, mergeItems(mergeTarget,item));
    back(()=>toast(`${mergeTarget.name} updated: now ${qtyU(mergeTarget.qty,mergeTarget.unit)}`,[["Undo",()=>{ Object.assign(mergeTarget,before); rerender(); toast("Change undone"); }]]));
    return;
  }
  if(r.mode==="add"){
    const it={id:S.nextId++,...item}; S.pantry.push(it); saveState();
    back(()=>toast(`${it.name} added`,[["Undo",()=>{ S.pantry=S.pantry.filter(p=>p!==it); rerender(); toast(`${it.name} removed`); }]]));
  } else {
    const it=S.pantry.find(p=>p.id===r.id); const before={...it}; Object.assign(it,item);
    back(()=>toast(`${it.name} updated`,[["Undo",()=>{ Object.assign(it,before); rerender(); toast("Change undone"); }]]));
  }
}

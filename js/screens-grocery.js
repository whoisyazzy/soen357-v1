/* screens-grocery.js: T3 Prepare grocery list (Figure 5.3). */
"use strict";

SCREENS.grocery = (r, e) => {
  e.gerr=e.gerr||{};
  let h=`<form id="gadd" novalidate><label class="flabel" for="gname">Add an item</label><div class="addrow"><div class="grow"><input class="input" id="gname" autocomplete="off" value="${esc(e.gdraft||"")}" ${e.addErr?'aria-invalid="true" aria-describedby="gname-err"':""}>${errHTML("gname",e.addErr)}</div><button type="submit" class="btn btn-secondary">Add</button></div></form>`;
  if(!S.grocery.length) h+=`<div class="empty">${I.empty}<p>Your grocery list is empty. Select a meal to add its missing items, or add an item.</p><button type="button" class="btn btn-primary" id="toMeals">Go to Meals</button></div>`;
  else {
    const groups=[...new Set(S.grocery.map(g=>g.src))].sort((a,b)=>(a==="Added by you")-(b==="Added by you"));
    for(const src of groups){
      h+=`<h2>${esc(src==="Added by you"?src:"For "+src)}</h2>`;
      for(const g of S.grocery.filter(x=>x.src===src)){
        const err=e.gerr[g.id];
        h+=`<div class="gitem ${g.done?"bought":""}"><div class="gtop"><input type="checkbox" id="gc${g.id}" data-chk="${g.id}" ${g.done?"checked":""}><label for="gc${g.id}"><span class="gname">${esc(g.name)}</span><span class="meta">${g.done?"Bought · ":""}${esc(src==="Added by you"?"Added by you":"From: "+src)}</span></label><button type="button" class="btn btn-danger btn-sm" data-rm="${g.id}" aria-label="Remove ${esc(g.name)}">Remove</button></div>
        <div class="gctl"><div class="stepper"><button type="button" data-st="${g.id}" data-k="-1" aria-label="Decrease ${esc(g.name)} quantity">−</button><input class="input" data-q="${g.id}" inputmode="decimal" aria-label="${esc(g.name)} quantity" value="${err?esc(err.raw):fmtQ(g.qty)}" ${err?`aria-invalid="true" aria-describedby="gq${g.id}-err"`:""}><button type="button" data-st="${g.id}" data-k="1" aria-label="Increase ${esc(g.name)} quantity">+</button></div><span class="unit">${esc(g.unit)}</span>${e.savedId===g.id&&!err?'<span class="saved" role="status">Saved</span>':""}</div>${err?errHTML("gq"+g.id,err.msg):""}</div>`;
      }
    }
  }
  return {title:"Grocery list", html:h, bind:()=>{
    $("#gname").oninput=ev=>{ e.gdraft=ev.target.value; if(e.addErr){ e.addErr=null; const n=$("#gname-err"); if(n) n.remove(); ev.target.removeAttribute("aria-invalid"); ev.target.removeAttribute("aria-describedby"); } };
    $("#gadd").onsubmit=ev=>{ ev.preventDefault(); const v=$("#gname").value.trim();
      if(!v){ e.addErr="Enter an item name"; rerender(); $("#gname").focus(); return; }
      if(v.length>40){ e.addErr="Use 40 characters or fewer"; rerender(); $("#gname").focus(); return; }
      e.addErr=null; e.gdraft="";
      if(findByName(S.grocery,v)){ rerender(); dialog("Already on your list",`${v} is already on your grocery list. Nothing was added twice.`,[["OK",null,"btn-primary"]]); return; }
      const g={id:S.gNext++,name:v,qty:1,unit:"units",src:"Added by you",done:false}; S.grocery.push(g); rerender(); $("#gname").focus();
      toast(`${v} added`,[["Undo",()=>{ S.grocery=S.grocery.filter(x=>x!==g); rerender(); }]]); };
    if($("#toMeals")) $("#toMeals").onclick=()=>switchTab("meals");
    $$("[data-chk]").forEach(c=>c.onchange=()=>{ e.addErr=null; const g=S.grocery.find(x=>x.id==c.dataset.chk); g.done=c.checked; rerender(); $("#gc"+g.id).focus(); });
    $$("[data-rm]").forEach(b=>b.onclick=()=>{ e.addErr=null; const idx=S.grocery.findIndex(x=>x.id==b.dataset.rm); const g=S.grocery[idx]; S.grocery.splice(idx,1); delete e.gerr[g.id]; rerender(); $("#title").focus();
      toast(`${g.name} removed`,[["Undo",()=>{ S.grocery.splice(idx,0,g); rerender(); toast(`${g.name} restored`); }]]); });
    const setQ=(g,raw,focusSel)=>{
      const msg=qtyError(raw);
      if(msg){ e.gerr[g.id]={raw:String(raw),msg}; rerender(); document.querySelector(focusSel).focus(); return; }
      delete e.gerr[g.id]; g.qty=parseQty(raw); e.savedId=g.id; rerender(); document.querySelector(focusSel).focus(); };
    $$("[data-st]").forEach(b=>b.onclick=()=>{ const g=S.grocery.find(x=>x.id==b.dataset.st); const nv=round2(g.qty+(+b.dataset.k)*groceryStep(g.unit));
      const sel=`[data-st="${g.id}"][data-k="${b.dataset.k}"]`;
      if(nv<=0){ e.gerr[g.id]={raw:fmtQ(g.qty),msg:"Enter a quantity greater than 0. To delete the item, use Remove."}; rerender(); document.querySelector(sel).focus(); return; }
      setQ(g,nv,sel); });
    $$("[data-q]").forEach(inp=>{ inp.onchange=()=>{ const g=S.grocery.find(x=>x.id==inp.dataset.q); setQ(g,inp.value,`[data-q="${g.id}"]`); }; });
  }};
};

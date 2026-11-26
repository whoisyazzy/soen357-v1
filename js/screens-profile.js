/* screens-profile.js: Profile and Edit profile (allergy source for T2). */
"use strict";

function freshNav(){
  for(const k of Object.keys(VS)) delete VS[k];
  Object.assign(tabLast,{pantry:"#/pantry",meals:"#/meals",grocery:"#/grocery",profile:"#/profile"});
}

SCREENS.profile = () => {
  const p=S.profile;
  const h=`<dl>
   <div class="kv"><dt>Allergies</dt><dd>${p.allergies.length?esc(p.allergies.join(", ")):"None"}</dd></div>
   <div class="kv"><dt>Dietary preferences</dt><dd>${p.prefs.length?esc(p.prefs.join(", ")):"None"}</dd></div>
   <div class="kv"><dt>Default servings</dt><dd>${p.servings}</dd></div>
   <div class="kv"><dt>Maximum time</dt><dd>${p.maxTime==="Any"?"Any":p.maxTime+" min"}</dd></div>
   <div class="kv"><dt>Display size</dt><dd>${Math.round(p.scale*100)} %</dd></div></dl>
   <button type="button" class="btn btn-secondary btn-block" id="editP">Edit profile</button>
   <section class="panel about" aria-labelledby="ab-h"><h2 id="ab-h">About this website</h2>
   <ul><li>Meal Planning Assistant, ${APP_VERSION} (${GROUP_ID}, SOEN 357). Sample website for learning and educational purposes only.</li>
   <li>All foods, recipes and sample dates are fictional sample data.</li>
   <li>Suggestions come from a fixed rule set, not a trained model. Ingredients are matched by name only; quantities are not compared.</li>
   <li>Your data is saved in this browser only. It is not sent anywhere.</li>
   <li>Dietary preferences are stored but not used to filter the sample recipes.</li></ul>
   <button type="button" class="btn btn-secondary btn-block" id="reset">Reset sample data</button></section>`;
  return {title:"Profile", html:h, bind:()=>{
    $("#editP").onclick=()=>go("#/profile/edit",{fresh:true});
    $("#reset").onclick=()=>dialog("Reset sample data?","All your changes will be lost and the sample data restored.",[["Reset sample data",()=>{ resetState(); freshNav(); go("#/pantry",{after:()=>toast("Sample data restored")}); },"btn-danger"],["Cancel",null,"btn-secondary"]]);
  }};
};

SCREENS.editProfile = (r, e, key) => {
  if(!e.draft){ const p=S.profile; e.orig={allergies:[...p.allergies],prefs:[...p.prefs],servings:String(p.servings),maxTime:p.maxTime,scale:p.scale}; e.draft=JSON.parse(JSON.stringify(e.orig)); e.errs={}; }
  const d=e.draft;
  const multi=(name,opts,vals,lab,opt)=>`<fieldset><legend>${lab}${opt?' <span class="opt">(optional)</span>':""}</legend><div class="chips">${opts.map(o=>`<label class="chip"><input type="checkbox" name="${name}" value="${esc(o)}" ${vals.includes(o)?"checked":""}><span>${vals.includes(o)?I.check:""}${esc(o)}</span></label>`).join("")}</div></fieldset>`;
  const h=`<form id="pf" novalidate>
   ${multi("allergies",ALLERGENS,d.allergies,"Allergies",true)}
   <p class="help allergy-help">Recipes containing a selected allergen are hidden from suggestions and search.</p>
   ${multi("prefs",PREFS,d.prefs,"Dietary preferences",true)}
   <div class="field"><label for="p-serv">Default servings</label><div class="stepper"><button type="button" id="pm" aria-label="Fewer servings">−</button><input class="input" id="p-serv" inputmode="numeric" value="${esc(d.servings)}" ${e.errs.servings?'aria-invalid="true" aria-describedby="p-serv-err"':""}><button type="button" id="pp" aria-label="More servings">+</button></div>${errHTML("p-serv",e.errs.servings)}</div>
   <fieldset><legend>Maximum time</legend><div class="chips">${MAX_TIMES.map(t=>`<label class="chip"><input type="radio" name="pmt" value="${t}" ${d.maxTime===t?"checked":""}><span>${t==="Any"?"Any":t+" min"}</span></label>`).join("")}</div></fieldset>
   <fieldset><legend>Display size</legend><div class="chips">${SCALES.map(s=>`<label class="chip"><input type="radio" name="psc" value="${s}" ${d.scale===s?"checked":""}><span>${Math.round(s*100)} %</span></label>`).join("")}</div></fieldset>
   <div class="btn-row"><button type="button" class="btn btn-secondary" id="pcancel">Cancel</button><button type="submit" class="btn btn-primary">Save</button></div></form>`;
  const leave=()=>{ if(!isDirty(key)){ delete VS[key]; return back(); } askDiscard(key,()=>{ delete VS[key]; back(); }); };
  return {title:"Edit profile", html:h, onBack:leave, bind:()=>{
    const sync=()=>{ d.allergies=$$("input[name=allergies]:checked").map(x=>x.value); d.prefs=$$("input[name=prefs]:checked").map(x=>x.value); d.servings=$("#p-serv").value; const m=document.querySelector("input[name=pmt]:checked").value; d.maxTime=m==="Any"?"Any":+m; d.scale=+document.querySelector("input[name=psc]:checked").value; };
    $("#pf").addEventListener("input",ev=>{ sync(); if(ev.target.id==="p-serv"&&e.errs.servings){ delete e.errs.servings; const n=$("#p-serv-err"); if(n) n.remove(); ev.target.removeAttribute("aria-invalid"); } });
    $("#pf").addEventListener("change",ev=>{ sync(); if(ev.target.type==="checkbox"){ const id=ev.target.name, v=ev.target.value; rerender(); document.querySelector(`input[name=${id}][value="${v}"]`).focus(); } });
    const st=k=>{ sync(); const v=parseInt(d.servings,10); d.servings=String(isNaN(v)?2:v+k); $("#p-serv").value=d.servings; };
    $("#pm").onclick=()=>st(-1); $("#pp").onclick=()=>st(1);
    $("#pcancel").onclick=leave;
    $("#pf").onsubmit=ev=>{ ev.preventDefault(); sync();
      const err=servingsError(d.servings);
      if(err){ e.errs={servings:err}; rerender(); $("#p-serv").focus(); return; }
      e.errs={}; const v=Number(d.servings.trim());
      const doSave=()=>{
        const p=S.profile; p.allergies=[...d.allergies]; p.prefs=[...d.prefs]; p.servings=v; p.maxTime=d.maxTime; p.scale=d.scale;
        S.filters.servings=v; S.filters.maxTime=d.maxTime;
        const conflict=RECIPES.filter(x=>S.selected.includes(x.id)&&blockedBy(x,p.allergies).length);
        /* Meals starts fresh with the new settings (as in Output C). */
        for(const k of Object.keys(VS)) if(tabOf(k)==="meals") delete VS[k];
        tabLast.meals="#/meals"; delete VS[key];
        const msg=conflict.length?`Profile saved. ${conflict[0].name} contains ${blockedBy(conflict[0],p.allergies).join(", ").toLowerCase()} and is no longer suggested. Its items stay on your grocery list.`:"Profile saved. Meals now use your new settings.";
        back(()=>toast(msg));
      };
      if(e.orig.allergies.length&&!d.allergies.length) dialog("Turn off allergy filter?","You removed all allergies. Meals will no longer hide recipes that contain allergens.",[["Save",doSave,"btn-primary"],["Keep editing",null,"btn-secondary"]]);
      else doSave();
    };
  }};
};

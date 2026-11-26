/* logic.js: the calculation and validation rules of Output C, as pure functions.
   No DOM access, so the same file is loaded by the website and by tests/logic.test.js. */
"use strict";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const WEEKDAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const SOON_DAYS = 3;          // 0..3 days away = "Use soon"
const MAX_QTY = 1000;
const MAX_NAME = 40;
const MIN_SERV = 1, MAX_SERV = 12;

/* ---------- Names ---------- */
/* Name matching (pantry, grocery list): case, extra spaces and a final "s"/"es" are ignored. */
function norm(s){ return String(s).trim().toLowerCase().replace(/\s+/g," ").replace(/(es|s)$/,""); }

/* ---------- Dates ---------- */
function startOfDay(d){ return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function addDays(d,n){ const x=new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate()+n); return x; }
function toISO(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function parseD(v){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(v||"")) return null;
  const [y,m,d]=v.split("-").map(Number); const dt=new Date(y,m-1,d);
  return (dt.getFullYear()===y&&dt.getMonth()===m-1&&dt.getDate()===d)?dt:null;
}
/* Whole calendar days from today to dt (rounding absorbs daylight-saving hours). */
function daysFrom(today, dt){ return Math.round((startOfDay(dt) - startOfDay(today))/86400000); }
function fmtD(dt, yr){ return dt.getDate()+" "+MONTHS[dt.getMonth()]+(yr?" "+dt.getFullYear():""); }
function fmtLong(dt){ return WEEKDAYS[dt.getDay()]+" "+fmtD(dt,true); }
function rel(n){ return n===0?"today":n===1?"tomorrow":n>1?"in "+n+" days":(n===-1?"yesterday":(-n)+" days ago"); }

/* Date status of a pantry item: past (<0 days), soon (0..3 days), later (>3 days), or null (no date). */
function dateStatus(it, today){
  if(!it || it.dtype==="None" || !it.date) return null;
  const dt=parseD(it.date); if(!dt) return null;
  const n=daysFrom(today, dt);
  if(n<0) return {k:"past", n, dt};
  if(n<=SOON_DAYS) return {k:"soon", n, dt};
  return {k:"later", n, dt};
}

/* ---------- Quantities ---------- */
function round2(q){ return Math.round(q*100)/100; }
function fmtQ(q){ return round2(q).toString(); }
function qtyU(q,u){ return fmtQ(q)+" "+(u==="units"?(round2(q)===1?"unit":"units"):u); }
/* Accepts "1.5" and "1,5". Returns NaN when not a number. */
function parseQty(raw){ const s=String(raw).trim(); if(s==="") return NaN; return Number(s.replace(",",".")); }
/* Quantity rule: greater than 0 and at most 1000; decimals accepted. Returns an error message or null. */
function qtyError(raw){
  const q=parseQty(raw);
  if(isNaN(q)||q<=0) return "Enter a quantity greater than 0 (decimals are accepted)";
  if(q>MAX_QTY) return "Enter a quantity of 1000 or less";
  return null;
}
/* Servings rule: a whole number from 1 to 12. */
function servingsError(raw){
  const s=String(raw).trim(), v=Number(s);
  return (!/^\d+$/.test(s)||v<MIN_SERV||v>MAX_SERV) ? "Enter servings from 1 to 12" : null;
}
/* Grocery stepper: +/- 50 for g and ml, +/- 1 for every other unit. */
function groceryStep(u){ return (u==="g"||u==="ml")?50:1; }
/* Ingredient stepper: +/- 1, never below 0; an empty or invalid field steps to 1 (up) or 0 (down). */
function stepIngredient(raw, k){ const v=parseFloat(raw); const n=isNaN(v)?(k>0?1:0):Math.max(0,v+k); return fmtQ(n); }

/* Add-to-existing merge: quantities are added (rounded to 2 decimals); the earlier date is kept. */
function mergeItems(existing, item){
  const out={qty:round2(existing.qty+item.qty), date:existing.date, dtype:existing.dtype};
  if(item.date && (!existing.date || item.date<existing.date)){ out.date=item.date; out.dtype=item.dtype; }
  return out;
}

/* ---------- Ingredient form validation ---------- */
function validateIngredient(d){
  const er={}, name=String(d.name||"").trim();
  if(!name) er.name="Enter an ingredient name"; else if(name.length>MAX_NAME) er.name="Use 40 characters or fewer";
  const qe=qtyError(d.qty); if(qe) er.qty=qe;
  if(!d.unit) er.unit="Choose a unit";
  if(!d.loc) er.loc="Choose where the item is stored";
  if(d.dtype!=="None"&&!parseD(d.date)) er.date="Enter a date, or set Date type to None";
  return er;
}

/* ---------- Recipes ---------- */
function findByName(list, name){ return list.find(p=>norm(p.name)===norm(name)); }
/* Scale factor = chosen servings / servings the recipe is written for. */
function scaleFactor(recipe, servings){ return servings / recipe.servings; }
/* Have / Missing analysis: an ingredient is "Have" when an item of the same name is in the pantry
   (quantities are not compared). "soon" = used items whose date status is Use soon. */
function analyse(recipe, pantry, servings, today){
  const f=scaleFactor(recipe, servings);
  const lines=recipe.ing.map(([n,q,u])=>{ const p=findByName(pantry,n); return {n, q:q*f, u, have:!!p, p}; });
  const uses=lines.filter(l=>l.have), missing=lines.filter(l=>!l.have);
  const soon=uses.filter(l=>{ const st=dateStatus(l.p,today); return st&&st.k==="soon"; });
  return {lines, uses, missing, soon};
}
function blockedBy(recipe, allergies){ return recipe.allergens.filter(a=>allergies.includes(a)); }
/* Suggestions: allergy-safe, not rejected, within max time; ranked by
   1) more Use-soon items, 2) fewer missing items, 3) shorter time. */
function rankSuggestions(recipes, ctx){
  const {pantry, servings, maxTime, allergies, rejected, today} = ctx;
  return recipes
    .filter(r=>blockedBy(r,allergies).length===0 && !rejected.includes(r.id) && (maxTime==="Any"||r.time<=maxTime))
    .map(r=>({r, a:analyse(r,pantry,servings,today)}))
    .sort((x,y)=>(y.a.soon.length-x.a.soon.length)||(x.a.missing.length-y.a.missing.length)||(x.r.time-y.r.time));
}

if(typeof module!=="undefined") module.exports = {
  norm, startOfDay, addDays, toISO, parseD, daysFrom, fmtD, fmtLong, rel, dateStatus,
  round2, fmtQ, qtyU, parseQty, qtyError, servingsError, groceryStep, stepIngredient, mergeItems,
  validateIngredient, findByName, scaleFactor, analyse, blockedBy, rankSuggestions
};

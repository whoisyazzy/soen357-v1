/* Calculation and validation checks for V1.  Run:  node --test tests/logic.test.js
   Expected values were calculated by hand from the rules in docs/V1/calculation-rules.md. */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const L = require("../js/logic.js");
// data.js is a browser script; load it into this scope to reuse the same recipes.
const vm = require("node:vm"); const fs = require("node:fs"); const path = require("node:path");
const ctx = Object.assign(vm.createContext({}), L);
vm.runInContext(fs.readFileSync(path.join(__dirname,"../js/data.js"),"utf8")+";this.RECIPES=RECIPES;this.seed=seed;", ctx);
const RECIPES = JSON.parse(JSON.stringify(ctx.RECIPES));   // copy out of the VM context
const R = id => RECIPES.find(r=>r.id===id);
const TODAY = new Date(2026,10,5);           // 5 Nov 2026, the Output C reference date
const item = (date,dtype="Personal reminder") => ({dtype,date});

test("C1 date status: 2 days away is Use soon", ()=>{ const s=L.dateStatus(item("2026-11-07"),TODAY); assert.equal(s.k,"soon"); assert.equal(s.n,2); });
test("C2 date status: today is Use soon (0 days)", ()=>assert.equal(L.dateStatus(item("2026-11-05"),TODAY).k,"soon"));
test("C3 date status: 3 days away is Use soon (boundary)", ()=>assert.equal(L.dateStatus(item("2026-11-08"),TODAY).k,"soon"));
test("C4 date status: 4 days away is later", ()=>assert.equal(L.dateStatus(item("2026-11-09"),TODAY).k,"later"));
test("C5 date status: yesterday is Past date", ()=>{ const s=L.dateStatus(item("2026-11-04"),TODAY); assert.equal(s.k,"past"); assert.equal(s.n,-1); });
test("C6 date status: Date type None has no status", ()=>assert.equal(L.dateStatus({dtype:"None",date:""},TODAY),null));
test("C7 days across the DST change (1 Nov 2026) are whole days", ()=>assert.equal(L.daysFrom(new Date(2026,9,31),new Date(2026,10,2)),2));
test("C8 relative wording", ()=>{ assert.equal(L.rel(0),"today"); assert.equal(L.rel(1),"tomorrow"); assert.equal(L.rel(2),"in 2 days"); assert.equal(L.rel(-1),"yesterday"); assert.equal(L.rel(-3),"3 days ago"); });

test("C9 scaling: skillet at 2 servings shows recipe amounts", ()=>{
  const a=L.analyse(R("skillet"),[],2,TODAY); assert.deepEqual(a.lines.map(l=>l.q),[2,150,1,15]); });
test("C10 scaling: skillet at 3 servings = x1.5", ()=>{
  const a=L.analyse(R("skillet"),[],3,TODAY); assert.deepEqual(a.lines.map(l=>l.q),[3,225,1.5,22.5]);
  assert.equal(L.qtyU(1.5,"can"),"1.5 can"); });
test("C11 scaling: pasta at 4 servings = 400 g", ()=>assert.equal(L.analyse(R("pasta"),[],4,TODAY).lines[0].q,400));
test("C12 scaling: pasta at 1 serving = 100 g, zucchini 0.5 units", ()=>{ const l=L.analyse(R("pasta"),[],1,TODAY).lines; assert.equal(l[0].q,100); assert.equal(L.qtyU(l[1].q,"units"),"0.5 units"); });

const PANTRY = [ {name:"Rice"},{name:"Canned tomatoes",dtype:"Best before",date:"2026-12-15"},{name:"Olive oil"},
                 {name:"Zucchini",dtype:"Personal reminder",date:"2026-11-07"} ];
test("C13 missing count with sample pantry + zucchini: skillet 0, pasta 1, soup 2", ()=>{
  assert.equal(L.analyse(R("skillet"),PANTRY,2,TODAY).missing.length,0);
  assert.deepEqual(L.analyse(R("pasta"),PANTRY,2,TODAY).missing.map(l=>l.n),["Pasta"]);
  assert.deepEqual(L.analyse(R("soup"),PANTRY,2,TODAY).missing.map(l=>l.n),["Onion","Vegetable stock"]); });
test("C14 missing count without zucchini: skillet 1, pasta 2", ()=>{
  const p=PANTRY.slice(0,3);
  assert.equal(L.analyse(R("skillet"),p,2,TODAY).missing.length,1);
  assert.equal(L.analyse(R("pasta"),p,2,TODAY).missing.length,2); });
test("C15 name matching ignores case, spaces and plural s", ()=>{
  assert.ok(L.findByName([{name:"  canned   TOMATO "}],"Canned tomatoes"));
  assert.ok(L.findByName([{name:"zucchinis"}],"Zucchini")); });
test("C16 ranking (30 min, peanut allergy): skillet, then pasta; peanut and soup excluded", ()=>{
  const s=L.rankSuggestions(RECIPES,{pantry:PANTRY,servings:2,maxTime:30,allergies:["Peanuts"],rejected:[],today:TODAY});
  assert.deepEqual(s.map(x=>x.r.id),["skillet","pasta"]); });
test("C17 ranking (Any time, no allergies): skillet, pasta, peanut, soup", ()=>{
  const s=L.rankSuggestions(RECIPES,{pantry:PANTRY,servings:2,maxTime:"Any",allergies:[],rejected:[],today:TODAY});
  assert.deepEqual(s.map(x=>x.r.id),["skillet","pasta","peanut","soup"]); });
test("C18 ranking: 15 min max time gives no suggestions (empty state)", ()=>{
  assert.equal(L.rankSuggestions(RECIPES,{pantry:PANTRY,servings:2,maxTime:15,allergies:["Peanuts"],rejected:[],today:TODAY}).length,0); });
test("C19 rejected recipe is not suggested", ()=>{
  const s=L.rankSuggestions(RECIPES,{pantry:PANTRY,servings:2,maxTime:30,allergies:["Peanuts"],rejected:["skillet"],today:TODAY});
  assert.deepEqual(s.map(x=>x.r.id),["pasta"]); });
test("C20 allergy filter: peanut recipe blocked by Peanuts; pasta blocked by Wheat", ()=>{
  assert.deepEqual(L.blockedBy(R("peanut"),["Peanuts"]),["Peanuts"]);
  assert.deepEqual(L.blockedBy(R("pasta"),["Wheat"]),["Wheat"]); });

test("C21 add to existing: 2 + 1.5 units = 3.5 units; earlier date kept", ()=>{
  const m=L.mergeItems({qty:2,date:"2026-11-07",dtype:"Personal reminder"},{qty:1.5,date:"2026-11-06",dtype:"Use by"});
  assert.deepEqual(m,{qty:3.5,date:"2026-11-06",dtype:"Use by"}); });
test("C22 add to existing: later date does not replace earlier", ()=>{
  const m=L.mergeItems({qty:2,date:"2026-11-07",dtype:"Personal reminder"},{qty:1,date:"2026-11-20",dtype:"Use by"});
  assert.equal(m.date,"2026-11-07"); assert.equal(m.qty,3); });
test("C23 add to existing rounds to 2 decimals: 0.1 + 0.2 = 0.3", ()=>assert.equal(L.mergeItems({qty:0.1,date:""},{qty:0.2,date:""}).qty,0.3));

test("C24 grocery step: 50 for g/ml, 1 otherwise", ()=>{ assert.equal(L.groceryStep("g"),50); assert.equal(L.groceryStep("ml"),50); assert.equal(L.groceryStep("can"),1); assert.equal(L.groceryStep("units"),1); });
test("C25 ingredient stepper: 2 +1 = 3; 0 -1 stays 0; empty +1 = 1", ()=>{ assert.equal(L.stepIngredient("2",1),"3"); assert.equal(L.stepIngredient("0",-1),"0"); assert.equal(L.stepIngredient("",1),"1"); });

test("V1 quantity validation", ()=>{
  assert.equal(L.qtyError("0"),"Enter a quantity greater than 0 (decimals are accepted)");
  assert.equal(L.qtyError(""),"Enter a quantity greater than 0 (decimals are accepted)");
  assert.equal(L.qtyError("abc"),"Enter a quantity greater than 0 (decimals are accepted)");
  assert.equal(L.qtyError("1001"),"Enter a quantity of 1000 or less");
  assert.equal(L.qtyError("1000"),null); assert.equal(L.qtyError("1,5"),null); assert.equal(L.parseQty("1,5"),1.5); });
test("V2 servings validation 1..12 whole numbers", ()=>{
  for(const ok of ["1","12","2"]) assert.equal(L.servingsError(ok),null);
  for(const bad of ["0","13","2.5","","x"]) assert.equal(L.servingsError(bad),"Enter servings from 1 to 12"); });
test("V3 ingredient form validation messages", ()=>{
  const er=L.validateIngredient({name:"",qty:"0",unit:"",loc:"",dtype:"Personal reminder",date:""});
  assert.deepEqual(er,{name:"Enter an ingredient name",qty:"Enter a quantity greater than 0 (decimals are accepted)",unit:"Choose a unit",loc:"Choose where the item is stored",date:"Enter a date, or set Date type to None"});
  assert.equal(L.validateIngredient({name:"x".repeat(41),qty:"1",unit:"g",loc:"Fridge",dtype:"None",date:""}).name,"Use 40 characters or fewer");
  assert.deepEqual(L.validateIngredient({name:"Zucchini",qty:"2",unit:"units",loc:"Fridge",dtype:"Personal reminder",date:"2026-11-07"}),{}); });
test("V4 invalid calendar date is rejected", ()=>{ assert.equal(L.parseD("2026-02-30"),null); assert.ok(L.parseD("2026-02-28")); });

test("D1 sample data: canned tomatoes best before is 40 days after today", ()=>{
  const s=ctx.seed(TODAY); assert.equal(s.pantry[1].date,"2026-12-15"); assert.equal(s.profile.allergies[0],"Peanuts"); });

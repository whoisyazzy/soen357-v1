/* store.js: app state, saved in the browser (localStorage) so data survives reloads.
   Testing support (for moderators, not shown to participants):
     ?reset              restore the sample data
     ?today=YYYY-MM-DD   use a fixed "today" (stays until ?today=off)            */
"use strict";

const STORE_KEY = "mpa.v1.data";
const TODAY_KEY = "mpa.v1.today";
let S = null;

function storageGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
function storageSet(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
function storageDel(k){ try{ localStorage.removeItem(k); }catch(e){} }

/* "Today": the real date, unless a test date was set with ?today=YYYY-MM-DD. */
function todayOverride(){ const v=storageGet(TODAY_KEY); return v&&parseD(v)?parseD(v):null; }
function getToday(){ return todayOverride() || startOfDay(new Date()); }

function loadState(){
  const raw=storageGet(STORE_KEY);
  if(raw){ try{ const d=JSON.parse(raw); if(d&&d.schema===1&&Array.isArray(d.pantry)) return d; }catch(e){} }
  return seed(getToday());
}
function saveState(){ storageSet(STORE_KEY, JSON.stringify(S)); }
function resetState(){ S=seed(getToday()); saveState(); }

/* Reads ?reset and ?today= once at start-up, then removes them from the address bar. */
function applyUrlOptions(){
  const p=new URLSearchParams(location.search); let used=false;
  if(p.has("today")){ const v=p.get("today"); if(v==="off") storageDel(TODAY_KEY); else if(parseD(v)) storageSet(TODAY_KEY,v); used=true; }
  if(p.has("reset")){ storageDel(STORE_KEY); used=true; }
  if(used) history.replaceState(null,"",location.pathname+location.hash);
}

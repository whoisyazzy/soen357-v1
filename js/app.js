/* app.js: start-up. */
"use strict";

document.addEventListener("keydown",ev=>{ if(ev.key==="Escape"&&!DIALOG&&TOAST) clearToast(); });
applyUrlOptions();
S = loadState();
startRouter();

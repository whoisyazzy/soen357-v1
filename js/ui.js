/* ui.js: small DOM helpers, toast messages and dialogs (same behaviour as Output C). */
"use strict";

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function errHTML(id,msg){ return msg?`<div class="err" id="${id}-err">${I.alert}<span>${esc(msg)}</span></div>`:""; }
function noteHTML(text){ return `<div class="note" role="note">${I.info}<span>${esc(text)}</span></div>`; }

/* ---------- Toast: one message at a time, with up to two actions ---------- */
let TOAST = null;
function toast(msg, actions=[]){ TOAST={msg,actions}; renderToast(); }
function clearToast(){ TOAST=null; renderToast(); }
function renderToast(){
  const z=$("#toastzone");
  if(!TOAST){ z.innerHTML=""; return; }
  const two=TOAST.actions.length>1;
  const x='<button type="button" class="x" data-tx aria-label="Dismiss message">×</button>';
  z.innerHTML=`<div class="toast${two?" two":""}" role="status"><span class="msg">${esc(TOAST.msg)}</span>${two?x:""}${TOAST.actions.map((a,i)=>`<button type="button" data-ta="${i}">${esc(a[0])}</button>`).join("")}${two?"":x}</div>`;
  z.querySelectorAll("[data-ta]").forEach(b=>b.onclick=()=>{ const a=TOAST.actions[+b.dataset.ta]; TOAST=null; renderToast(); a[1](); });
  z.querySelector("[data-tx]").onclick=()=>{ clearToast(); $("#main").focus(); };
}

/* ---------- Modal dialog: focus is trapped inside; Escape or × closes it ---------- */
let DIALOG = null;
function dialog(title, body, buttons, onClose){
  closeDialog();
  const lastFocus=document.activeElement;
  const ov=document.createElement("div"); ov.className="overlay"; ov.id="ov";
  ov.innerHTML=`<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-t" aria-describedby="dlg-b"><div class="dh"><h2 id="dlg-t">${esc(title)}</h2><button type="button" class="close" aria-label="Close">×</button></div><p id="dlg-b">${esc(body)}</p><div class="stack">${buttons.map((b,i)=>`<button type="button" class="btn btn-block ${b[2]||(i===0?"btn-primary":"btn-secondary")}" data-db="${i}">${esc(b[0])}</button>`).join("")}</div></div>`;
  document.body.appendChild(ov);
  $("#app").setAttribute("aria-hidden","true");
  const key=e=>{
    if(e.key==="Escape"){ e.preventDefault(); e.stopPropagation(); close(); }
    if(e.key==="Tab"){ const f=[...ov.querySelectorAll("button")]; const i=f.indexOf(document.activeElement);
      if(e.shiftKey&&i<=0){e.preventDefault();f[f.length-1].focus();} else if(!e.shiftKey&&i===f.length-1){e.preventDefault();f[0].focus();} }
  };
  const remove=()=>{ ov.remove(); $("#app").removeAttribute("aria-hidden"); document.removeEventListener("keydown",key,true); DIALOG=null; };
  const close=(fn)=>{ remove(); if(fn) fn(); else { if(onClose) onClose(); if(lastFocus&&document.contains(lastFocus)) lastFocus.focus(); } };
  ov.querySelectorAll("[data-db]").forEach(b=>b.onclick=()=>close(buttons[+b.dataset.db][1]));
  ov.querySelector(".close").onclick=()=>close();
  document.addEventListener("keydown",key,true);
  DIALOG={remove};
  ov.querySelector("[data-db]").focus();
}
function closeDialog(){ if(DIALOG) DIALOG.remove(); }

(function(){
"use strict";

var historyObserver=null;
var appPatched=false;

function installStyle(){
  if(document.getElementById("wheelAchievementsStyle")) return;
  var s=document.createElement("style");
  s.id="wheelAchievementsStyle";
  s.textContent=`
.achievementBox{width:min(100%,620px);box-sizing:border-box;margin:12px auto 0;padding:14px 14px 12px;border:1px solid rgba(84,105,97,.12);border-radius:17px;background:rgba(255,255,255,.46);-webkit-backdrop-filter:blur(15px) saturate(135%);backdrop-filter:blur(15px) saturate(135%);box-shadow:inset 0 1px 0 rgba(255,255,255,.82),0 8px 22px rgba(36,52,46,.045)}
.achievementHead{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px}.achievementTitle{font-size:14px;font-weight:760;color:var(--text)}.achievementCount{font-size:11px;color:var(--muted);padding:4px 8px;border-radius:999px;background:rgba(255,255,255,.52)}
.achievementList{display:grid;gap:7px}.achievementItem{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:42px;padding:8px 9px 8px 11px;border-radius:12px;background:rgba(255,255,255,.50);border:1px solid rgba(78,102,93,.085)}.achievementMain{display:flex;align-items:center;gap:8px;min-width:0}.achievementNo{flex:0 0 auto;font-size:10px;color:var(--muted);font-variant-numeric:tabular-nums}.achievementText{min-width:0;font-size:13px;line-height:1.35;color:var(--text);overflow-wrap:anywhere}
.achievementRestore,.achievementAdminTools,.achievementAdminControl{display:none!important}.achievementEmpty{padding:8px 2px 5px;font-size:12px;color:var(--muted);text-align:center}
body.adminMode .achievementRestore{display:inline-flex!important}body.adminMode .achievementAdminTools{display:grid!important}.achievementAdminTools{grid-template-columns:minmax(0,1fr) auto;gap:8px;margin:0 0 10px;padding:10px;border-radius:12px;background:rgba(255,255,255,.38);border:1px solid rgba(78,102,93,.08)}.achievementAdminTools select{min-width:0;width:100%;box-sizing:border-box;border:1px solid rgba(80,103,95,.14);background:rgba(255,255,255,.72);color:var(--text);border-radius:10px;padding:8px 9px;font-size:13px}.achievementAdminTools button{min-height:38px!important;padding:7px 10px!important;font-size:12px!important}.achievementRestore{flex:0 0 auto;min-height:32px!important;padding:6px 9px!important;font-size:11px!important;border-radius:10px!important}
body:not(.adminMode) #resetBtn.achievementAdminControl,body:not(.adminMode) #undoBtn.achievementAdminControl{display:none!important}
@media(max-width:680px){.achievementBox{margin-top:9px;padding:11px;border-radius:15px}.achievementItem{min-height:40px;padding:7px 8px 7px 10px}.achievementText{font-size:12px}.achievementAdminTools{grid-template-columns:1fr}.achievementAdminTools button{min-height:42px!important}body.adminMode .achievementRestore{min-height:36px!important}}
`;
  document.head.appendChild(s);
}

function hideLegacyUi(){
  var history=document.getElementById("history");
  if(history){history.style.display="none";var title=history.previousElementSibling;if(title&&title.classList&&title.classList.contains("sectionTitle"))title.style.display="none";}
  var noRepeat=document.getElementById("noRepeat");
  if(noRepeat){noRepeat.checked=true;var wrap=noRepeat.closest("div");if(wrap)wrap.style.display="none";}
}

function ensurePanel(){
  var existing=document.getElementById("achievementBox");
  if(existing) return existing;
  var anchor=document.querySelector(".wheelResultBox")||document.querySelector(".resultBox");
  if(!anchor||!anchor.parentNode) return null;
  var box=document.createElement("section");
  box.id="achievementBox";
  box.className="achievementBox";
  box.innerHTML='<div class="achievementHead"><div class="achievementTitle">成果展示</div><div id="achievementCount" class="achievementCount">0 项</div></div><div id="achievementAdminTools" class="achievementAdminTools"><select id="achievementPendingSelect" aria-label="选择要标记为已转出的项目"></select><button type="button" id="achievementMarkBtn">标记已转出</button></div><div id="achievementList" class="achievementList"></div>';
  anchor.insertAdjacentElement("afterend",box);
  document.getElementById("achievementMarkBtn").addEventListener("click",markSelected);
  return box;
}

function rt(){return window.WeekendWheelRuntime||null;}
function shared(){return window.WeekendWheelSharedProgress||null;}
function results(){try{return rt()&&typeof rt().getCompleted==="function"?(rt().getCompleted()||[]):[]}catch(e){return[]}}
function remaining(){try{return rt()&&typeof rt().getRemaining==="function"?(rt().getRemaining()||[]):[]}catch(e){return[]}}
function ensureWritable(){var s=shared();if(!s||typeof s.canWrite!=="function"||!s.canWrite()){alert("当前设备没有管理员写入凭证，无法修改共享成果。");return false}return true;}
function busy(){try{return !!(rt()&&rt().isBusy&&rt().isBusy())}catch(e){return false}}

async function markSelected(){
  if(busy()){alert("请先停止转盘，再标记成果。");return;}
  if(!ensureWritable())return;
  var sel=document.getElementById("achievementPendingSelect");
  var idx=parseInt(sel&&sel.value,10);
  if(!(idx>=0))return;
  if(!rt()||!rt().markCompleted(idx))return;
  try{await shared().addCompletedByIndex(idx,false);}catch(e){rt().restoreCompleted(idx);alert("共享成果写入失败，本次标记已撤回，请稍后重试。");}
}

async function restore(index){
  if(busy()){alert("请先停止转盘，再把成果移回轮盘。");return;}
  if(!ensureWritable())return;
  if(!rt()||!rt().restoreCompleted(index))return;
  try{await shared().removeCompletedByIndex(index,false);}catch(e){rt().markCompleted(index);alert("共享成果更新失败，本次恢复已撤回，请稍后重试。");}
}

function render(){
  if(!ensurePanel()) return;
  var list=document.getElementById("achievementList");
  var count=document.getElementById("achievementCount");
  var select=document.getElementById("achievementPendingSelect");
  var mark=document.getElementById("achievementMarkBtn");
  if(!list||!count) return;

  var arr=results();
  var pending=remaining();
  count.textContent=arr.length+" 项";
  list.innerHTML="";

  if(select){
    select.innerHTML="";
    pending.forEach(function(row){var o=document.createElement("option");o.value=String(row.index);o.textContent=row.text;select.appendChild(o);});
    select.disabled=pending.length===0;
  }
  if(mark) mark.disabled=pending.length===0;

  var undo=document.getElementById("undoBtn");
  var reset=document.getElementById("resetBtn");
  if(undo&&undo.dataset.achievementOwned==="1") undo.disabled=arr.length===0;
  if(reset&&reset.dataset.achievementOwned==="1") reset.disabled=arr.length===0;

  if(!arr.length){var empty=document.createElement("div");empty.className="achievementEmpty";empty.textContent="还没有转到结果";list.appendChild(empty);return;}

  arr.slice().reverse().forEach(function(row,reverseIndex){
    var sequence=arr.length-reverseIndex;
    var item=document.createElement("div");item.className="achievementItem";
    var main=document.createElement("div");main.className="achievementMain";
    var no=document.createElement("span");no.className="achievementNo";no.textContent="#"+sequence;
    var text=document.createElement("span");text.className="achievementText";text.textContent=row.text||"已删除项目";
    main.appendChild(no);main.appendChild(text);
    var btn=document.createElement("button");btn.type="button";btn.className="achievementRestore";btn.textContent="移回轮盘";btn.addEventListener("click",function(){restore(row.index);});
    item.appendChild(main);item.appendChild(btn);list.appendChild(item);
  });
}

function replaceControls(){
  var reset=document.getElementById("resetBtn");
  if(reset&&reset.dataset.achievementOwned!=="1"){
    var resetNew=reset.cloneNode(true);resetNew.dataset.achievementOwned="1";resetNew.classList.add("achievementAdminControl");resetNew.textContent="重置成果";reset.parentNode.replaceChild(resetNew,reset);
    resetNew.addEventListener("click",async function(){
      var old=results();if(!old.length)return;if(!ensureWritable())return;if(!confirm("确定清空当前配置的全部共享成果，并把所有选项重新放回轮盘吗？"))return;
      if(!rt()||!rt().clearCompleted())return;
      try{await shared().clearSlot(false);}catch(e){rt().applySharedCompleted(old);alert("共享成果清空失败，本次重置已撤回，请稍后重试。");}
    });
  }

  var undo=document.getElementById("undoBtn");
  if(undo&&undo.dataset.achievementOwned!=="1"){
    var undoNew=undo.cloneNode(true);undoNew.dataset.achievementOwned="1";undoNew.classList.add("achievementAdminControl");undoNew.textContent="撤回上次";undo.parentNode.replaceChild(undoNew,undo);
    undoNew.addEventListener("click",async function(){
      var arr=results();if(!arr.length||!ensureWritable())return;var idx=arr[arr.length-1].index;if(!rt().restoreLastCompleted())return;
      try{await shared().removeCompletedByIndex(idx,false);}catch(e){rt().markCompleted(idx);alert("共享成果更新失败，本次撤回已恢复，请稍后重试。");}
    });
  }
}

function activeSlotFromProfileUi(){
  var el=document.querySelector("#profileGrid .profileCard.active .profileSlot");
  var m=el&&String(el.textContent||"").match(/(\d+)/);
  var n=m?parseInt(m[1],10):parseInt(window.WeekendWheelActiveSlot,10);
  return n>=1&&n<=3?n:0;
}

function patchAppSetItems(){
  if(appPatched||!window.WeekendWheelApp||typeof window.WeekendWheelApp.setItems!=="function") return;
  var original=window.WeekendWheelApp.setItems;
  window.WeekendWheelApp.setItems=function(arr){
    var slot=activeSlotFromProfileUi();
    if(slot&&rt()&&typeof rt().setProfileSlot==="function")rt().setProfileSlot(slot);
    var ok=original.call(window.WeekendWheelApp,arr);
    if(ok&&slot&&shared()&&typeof shared().setSlot==="function")shared().setSlot(slot);
    return ok;
  };
  appPatched=true;
}

function watchHistory(){
  var history=document.getElementById("history");
  if(!history||historyObserver) return;
  historyObserver=new MutationObserver(render);
  historyObserver.observe(history,{childList:true,subtree:true,characterData:true});
}

function boot(){
  installStyle();hideLegacyUi();
  if(!rt()||typeof rt().getCompleted!=="function"){setTimeout(boot,80);return;}
  replaceControls();patchAppSetItems();ensurePanel();watchHistory();render();
  window.addEventListener("weekend-wheel-shared-progress",render);
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();

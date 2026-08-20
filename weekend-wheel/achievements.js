(function(){
"use strict";

var historyObserver=null;
var appPatched=false;

function installStyle(){
  if(document.getElementById("wheelAchievementsStyle")) return;
  var s=document.createElement("style");
  s.id="wheelAchievementsStyle";
  s.textContent=`
.achievementBox{
  width:min(100%,620px);
  box-sizing:border-box;
  margin:12px auto 0;
  padding:14px 14px 12px;
  border:1px solid rgba(84,105,97,.12);
  border-radius:17px;
  background:rgba(255,255,255,.46);
  -webkit-backdrop-filter:blur(15px) saturate(135%);
  backdrop-filter:blur(15px) saturate(135%);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.82),0 8px 22px rgba(36,52,46,.045);
}
.achievementHead{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px}
.achievementTitle{font-size:14px;font-weight:760;color:var(--text)}
.achievementCount{font-size:11px;color:var(--muted);padding:4px 8px;border-radius:999px;background:rgba(255,255,255,.52)}
.achievementList{display:grid;gap:7px}
.achievementItem{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:42px;padding:8px 9px 8px 11px;border-radius:12px;background:rgba(255,255,255,.50);border:1px solid rgba(78,102,93,.085)}
.achievementMain{display:flex;align-items:center;gap:8px;min-width:0}
.achievementNo{flex:0 0 auto;font-size:10px;color:var(--muted);font-variant-numeric:tabular-nums}
.achievementText{min-width:0;font-size:13px;line-height:1.35;color:var(--text);overflow-wrap:anywhere}
.achievementRestore{display:none!important;flex:0 0 auto;min-height:32px!important;padding:6px 9px!important;font-size:11px!important;border-radius:10px!important}
body.adminMode .achievementRestore{display:inline-flex!important}
.achievementEmpty{padding:8px 2px 5px;font-size:12px;color:var(--muted);text-align:center}
@media(max-width:680px){
  .achievementBox{margin-top:9px;padding:11px;border-radius:15px}
  .achievementItem{min-height:40px;padding:7px 8px 7px 10px}
  .achievementText{font-size:12px}
  body.adminMode .achievementRestore{min-height:36px!important}
}
`;
  document.head.appendChild(s);
}

function hideLegacyUi(){
  var history=document.getElementById("history");
  if(history){
    history.style.display="none";
    var title=history.previousElementSibling;
    if(title&&title.classList&&title.classList.contains("sectionTitle")) title.style.display="none";
  }

  var noRepeat=document.getElementById("noRepeat");
  if(noRepeat){
    noRepeat.checked=true;
    var wrap=noRepeat.closest("div");
    if(wrap) wrap.style.display="none";
  }
}

function ensurePanel(){
  var existing=document.getElementById("achievementBox");
  if(existing) return existing;

  var anchor=document.querySelector(".wheelResultBox")||document.querySelector(".resultBox");
  if(!anchor||!anchor.parentNode) return null;

  var box=document.createElement("section");
  box.id="achievementBox";
  box.className="achievementBox";
  box.innerHTML='<div class="achievementHead"><div class="achievementTitle">成果展示</div><div id="achievementCount" class="achievementCount">0 项</div></div><div id="achievementList" class="achievementList"></div>';
  anchor.insertAdjacentElement("afterend",box);
  return box;
}

function results(){
  try{
    if(window.WeekendWheelRuntime&&typeof window.WeekendWheelRuntime.getCompleted==="function"){
      return window.WeekendWheelRuntime.getCompleted()||[];
    }
  }catch(e){}
  return [];
}

function restore(index){
  try{
    if(window.WeekendWheelRuntime&&window.WeekendWheelRuntime.isBusy&&window.WeekendWheelRuntime.isBusy()){
      alert("请先停止转盘，再把成果移回轮盘。");
      return;
    }
    if(window.WeekendWheelRuntime&&typeof window.WeekendWheelRuntime.restoreCompleted==="function"){
      window.WeekendWheelRuntime.restoreCompleted(index);
    }
  }catch(e){}
}

function render(){
  if(!ensurePanel()) return;
  var list=document.getElementById("achievementList");
  var count=document.getElementById("achievementCount");
  if(!list||!count) return;

  var arr=results();
  count.textContent=arr.length+" 项";
  list.innerHTML="";

  var undo=document.getElementById("undoBtn");
  var reset=document.getElementById("resetBtn");
  if(undo&&undo.dataset.achievementOwned==="1") undo.disabled=arr.length===0;
  if(reset&&reset.dataset.achievementOwned==="1") reset.disabled=arr.length===0;

  if(!arr.length){
    var empty=document.createElement("div");
    empty.className="achievementEmpty";
    empty.textContent="还没有转到结果";
    list.appendChild(empty);
    return;
  }

  arr.slice().reverse().forEach(function(row,reverseIndex){
    var sequence=arr.length-reverseIndex;
    var item=document.createElement("div");
    item.className="achievementItem";

    var main=document.createElement("div");
    main.className="achievementMain";
    var no=document.createElement("span");
    no.className="achievementNo";
    no.textContent="#"+sequence;
    var text=document.createElement("span");
    text.className="achievementText";
    text.textContent=row.text||"已删除项目";
    main.appendChild(no);
    main.appendChild(text);

    var btn=document.createElement("button");
    btn.type="button";
    btn.className="achievementRestore";
    btn.textContent="移回轮盘";
    btn.addEventListener("click",function(){restore(row.index);});

    item.appendChild(main);
    item.appendChild(btn);
    list.appendChild(item);
  });
}

function replaceControls(){
  var reset=document.getElementById("resetBtn");
  if(reset&&reset.dataset.achievementOwned!=="1"){
    var resetNew=reset.cloneNode(true);
    resetNew.dataset.achievementOwned="1";
    resetNew.textContent="重置成果";
    reset.parentNode.replaceChild(resetNew,reset);
    resetNew.addEventListener("click",function(){
      if(!results().length) return;
      if(!confirm("确定清空当前配置的全部成果记录，并把所有选项重新放回轮盘吗？")) return;
      if(window.WeekendWheelRuntime&&typeof window.WeekendWheelRuntime.clearCompleted==="function"){
        window.WeekendWheelRuntime.clearCompleted();
      }
    });
  }

  var undo=document.getElementById("undoBtn");
  if(undo&&undo.dataset.achievementOwned!=="1"){
    var undoNew=undo.cloneNode(true);
    undoNew.dataset.achievementOwned="1";
    undoNew.textContent="撤回上次";
    undo.parentNode.replaceChild(undoNew,undo);
    undoNew.addEventListener("click",function(){
      if(window.WeekendWheelRuntime&&typeof window.WeekendWheelRuntime.restoreLastCompleted==="function"){
        window.WeekendWheelRuntime.restoreLastCompleted();
      }
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
    if(slot&&window.WeekendWheelRuntime&&typeof window.WeekendWheelRuntime.setProfileSlot==="function"){
      window.WeekendWheelRuntime.setProfileSlot(slot);
    }
    return original.call(window.WeekendWheelApp,arr);
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
  installStyle();
  hideLegacyUi();

  if(!window.WeekendWheelRuntime||typeof window.WeekendWheelRuntime.getCompleted!=="function"){
    setTimeout(boot,80);
    return;
  }

  replaceControls();
  patchAppSetItems();
  ensurePanel();
  watchHistory();
  render();
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();

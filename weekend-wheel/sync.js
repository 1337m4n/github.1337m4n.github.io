(function(){
"use strict";

var loadGeneration=0;

function setUi(){
  var btn=document.getElementById("saveBtn");
  if(btn) btn.textContent="保存当前配置";

  var notes=document.querySelectorAll(".sidePanel .note");
  if(notes.length){
    notes[notes.length-1].textContent="页面优先读取线上当前启用配置；管理员可在配置库中保存、切换最多 3 份轮盘配置。";
  }

  var footer=document.querySelector(".footer");
  if(footer) footer.textContent="支持 3 份线上配置 · 成果持续记录";
}

function wheelBusy(){
  try{
    if(window.WeekendWheelRuntime&&typeof window.WeekendWheelRuntime.isBusy==="function")return !!window.WeekendWheelRuntime.isBusy();
  }catch(e){}
  return false;
}

function activeSelection(data){
  if(!data||typeof data!=="object")return {slot:0,items:[]};
  if(Number(data.version)>=2&&Array.isArray(data.slots)){
    var n=parseInt(data.activeSlot,10);
    if(n>=1&&n<=3){
      var slot=data.slots[n-1];
      if(slot&&Array.isArray(slot.items)&&slot.items.length>=2)return {slot:n,items:slot.items};
    }
  }
  return {slot:0,items:Array.isArray(data.items)?data.items:[]};
}

function applyWhenIdle(arr,generation,slotNo){
  function apply(){
    if(generation!==loadGeneration)return;
    if(wheelBusy()){
      setTimeout(apply,150);
      return;
    }
    if(generation!==loadGeneration)return;

    if(slotNo>=1&&slotNo<=3){
      window.WeekendWheelActiveSlot=slotNo;
      try{
        if(window.WeekendWheelRuntime&&typeof window.WeekendWheelRuntime.setProfileSlot==="function"){
          window.WeekendWheelRuntime.setProfileSlot(slotNo);
        }
      }catch(e){}
    }

    if(!window.WeekendWheelApp||!window.WeekendWheelApp.setItems(arr)){
      console.warn("线上配置内容无效，继续使用当前配置。");
    }
  }
  apply();
}

async function load(){
  var generation=++loadGeneration;
  try{
    var r=await fetch("./config.json?t="+Date.now(),{cache:"no-store"});
    if(generation!==loadGeneration)return;
    if(!r.ok)throw new Error("HTTP "+r.status);
    var data=await r.json();
    if(generation!==loadGeneration)return;
    var selection=activeSelection(data);
    if(!Array.isArray(selection.items)||selection.items.length<2)throw new Error("配置内容无效");
    applyWhenIdle(selection.items,generation,selection.slot);
  }catch(e){
    if(generation===loadGeneration)console.warn("线上配置读取失败，继续使用本地缓存。",e);
  }
}

function cancelPending(){
  loadGeneration++;
}

async function save(){
  if(window.WeekendWheelProfiles&&typeof window.WeekendWheelProfiles.saveActive==="function"){
    return window.WeekendWheelProfiles.saveActive();
  }
  alert("配置管理模块尚未加载完成，请稍后再试。");
}

window.WeekendWheelSync={load:load,save:save,cancelPending:cancelPending};
setUi();
load();

})();
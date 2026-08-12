(function(){
"use strict";

var OWNER="1337m4n";
var REPO="github.1337m4n.github.io";
var BRANCH="master";
var CONFIG_PATH="weekend-wheel/config.json";
var TOKEN_KEY="weekendWheelGithubTokenV1";
var state=null;
var busy=false;

function api(){return "https://api.github.com/repos/"+OWNER+"/"+REPO+"/contents/"+CONFIG_PATH;}
function readToken(){try{return(localStorage.getItem(TOKEN_KEY)||"").trim()}catch(e){return""}}
function headers(t){return{"Accept":"application/vnd.github+json","Authorization":"Bearer "+t,"X-GitHub-Api-Version":"2022-11-28"};}
function encode64(s){var a=new TextEncoder().encode(s),x="";for(var i=0;i<a.length;i++)x+=String.fromCharCode(a[i]);return btoa(x);}
function decode64(s){var bin=atob((s||"").replace(/\s/g,"")),a=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return new TextDecoder().decode(a);}
function cloneItems(arr){return Array.isArray(arr)?arr.map(function(x){return String(x).trim();}).filter(Boolean):[];}
function now(){return new Date().toISOString();}

function normalize(doc){
  doc=doc&&typeof doc==="object"?doc:{};
  var slots=[null,null,null];
  if(Array.isArray(doc.slots)){
    for(var i=0;i<3;i++){
      var s=doc.slots[i];
      if(s&&Array.isArray(s.items)&&s.items.length>=2){
        slots[i]={id:i+1,name:String(s.name||("配置 "+(i+1))),updatedAt:s.updatedAt||doc.updatedAt||now(),items:cloneItems(s.items)};
      }
    }
  }
  if(!slots[0]){
    var legacy=cloneItems(doc.items);
    if(legacy.length>=2)slots[0]={id:1,name:"周末去哪儿",updatedAt:doc.updatedAt||now(),items:legacy};
  }
  var active=parseInt(doc.activeSlot,10);
  if(!(active>=1&&active<=3)||!slots[active-1]){
    active=slots.findIndex(function(s){return!!s})+1;
    if(active<1)active=1;
  }
  if(!slots[active-1]){
    slots[0]={id:1,name:"配置 1",updatedAt:now(),items:["新选项 1","新选项 2"]};
    active=1;
  }
  var activeItems=cloneItems(slots[active-1].items);
  return {version:2,updatedAt:doc.updatedAt||now(),activeSlot:active,items:activeItems,slots:slots};
}

async function readApi(){
  var t=readToken();
  if(!t)throw new Error("NO_TOKEN");
  var r=await fetch(api()+"?ref="+encodeURIComponent(BRANCH)+"&t="+Date.now(),{headers:headers(t),cache:"no-store"});
  if(!r.ok)throw new Error(r.status===401||r.status===403?"TOKEN":"READ");
  var meta=await r.json();
  var doc={};
  try{doc=JSON.parse(decode64(meta.content));}catch(e){throw new Error("PARSE");}
  return {token:t,sha:meta.sha,doc:normalize(doc)};
}

async function writeApi(mutator,message){
  if(busy)return null;
  busy=true;
  setPanelBusy(true);
  try{
    var current=await readApi();
    var doc=current.doc;
    mutator(doc);
    doc.version=2;
    doc.updatedAt=now();
    var active=doc.slots[doc.activeSlot-1];
    if(!active||!Array.isArray(active.items)||active.items.length<2)throw new Error("BAD_ACTIVE");
    doc.items=cloneItems(active.items);
    var p=await fetch(api(),{
      method:"PUT",
      headers:Object.assign({"Content-Type":"application/json"},headers(current.token)),
      body:JSON.stringify({message:message||"Update wheel profile library",content:encode64(JSON.stringify(doc,null,2)),sha:current.sha,branch:BRANCH})
    });
    if(!p.ok)throw new Error(p.status===401||p.status===403?"TOKEN":"WRITE");
    state=normalize(doc);
    render();
    return state;
  }finally{
    busy=false;
    setPanelBusy(false);
  }
}

function sameItems(a,b){
  a=cloneItems(a);b=cloneItems(b);
  if(a.length!==b.length)return false;
  for(var i=0;i<a.length;i++)if(a[i]!==b[i])return false;
  return true;
}
function wheelItems(){return window.WeekendWheelApp&&window.WeekendWheelApp.getItems?window.WeekendWheelApp.getItems():[];}
function wheelBusy(){try{return!!(window.WeekendWheelRuntime&&window.WeekendWheelRuntime.isBusy&&window.WeekendWheelRuntime.isBusy())}catch(e){return false}}
function ensureIdle(){if(wheelBusy()){alert("请先停止转盘，再切换或保存配置。");return false}return true;}

function installStyle(){
  if(document.getElementById("wheelProfileStyle"))return;
  var s=document.createElement("style");
  s.id="wheelProfileStyle";
  s.textContent=`
.profilePanel{display:none!important;margin-top:14px;padding:16px!important}
body.adminMode .profilePanel{display:block!important}
.profileHead{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}
.profileTitle{font-size:16px;font-weight:750;color:var(--text)}
.profileHint{font-size:12px;line-height:1.5;color:var(--muted);margin-top:3px}
.profileGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.profileCard{border:1px solid rgba(80,103,95,.12);background:rgba(255,255,255,.48);border-radius:16px;padding:12px;box-shadow:inset 0 1px 0 rgba(255,255,255,.8)}
.profileCard.active{border-color:rgba(49,123,108,.34);box-shadow:0 0 0 2px rgba(49,123,108,.08),inset 0 1px 0 rgba(255,255,255,.88)}
.profileMeta{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px}
.profileSlot{font-size:12px;font-weight:750;color:var(--accent-deep)}
.profileStatus{font-size:11px;color:var(--muted)}
.profileName{width:100%;box-sizing:border-box;border:1px solid rgba(80,103,95,.14);background:rgba(255,255,255,.68);color:var(--text);border-radius:11px;padding:9px 10px;font-size:14px;outline:none}
.profileName:focus{border-color:rgba(49,123,108,.34);box-shadow:0 0 0 3px rgba(49,123,108,.08)}
.profileInfo{font-size:12px;color:var(--muted);margin:8px 0 10px;min-height:18px}
.profileBtns{display:grid;grid-template-columns:1fr 1fr;gap:7px}
.profileBtns button{min-height:38px;padding:8px 9px;font-size:12px}
.profileEmpty{opacity:.72}
.profileToolbar{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
.profileToolbar button{min-height:40px}
@media(max-width:760px){.profileGrid{grid-template-columns:1fr}.profilePanel{padding:12px!important}.profileHead{display:block}.profileToolbar{margin-top:10px}.profileBtns button{min-height:42px}}
`;
  document.head.appendChild(s);
}

function buildPanel(){
  if(document.getElementById("profilePanel"))return;
  var panel=document.createElement("section");
  panel.id="profilePanel";
  panel.className="panel adminOnlyBlock profilePanel";
  panel.innerHTML='<div class="profileHead"><div><div class="profileTitle">轮盘配置库</div><div class="profileHint">最多保存 3 份线上配置。普通访问者只会看到当前启用的配置。</div></div></div><div id="profileGrid" class="profileGrid"></div><div class="profileToolbar"><button type="button" id="newProfileBtn">＋ 新建空白配置</button><button type="button" id="refreshProfilesBtn">刷新配置库</button></div>';
  var editor=document.querySelector(".editorPanel");
  if(editor&&editor.parentNode)editor.parentNode.insertBefore(panel,editor);
  else document.querySelector(".wrap")&&document.querySelector(".wrap").appendChild(panel);
  document.getElementById("newProfileBtn").addEventListener("click",newProfile);
  document.getElementById("refreshProfilesBtn").addEventListener("click",refresh);
}

function render(){
  var grid=document.getElementById("profileGrid");
  if(!grid||!state)return;
  grid.innerHTML="";
  for(var i=0;i<3;i++){
    (function(slotIndex){
      var slot=state.slots[slotIndex];
      var card=document.createElement("div");
      card.className="profileCard"+(state.activeSlot===slotIndex+1?" active":"")+(!slot?" profileEmpty":"");
      var name=slot?slot.name:("配置 "+(slotIndex+1));
      var count=slot?slot.items.length:0;
      card.innerHTML='<div class="profileMeta"><span class="profileSlot">槽位 '+(slotIndex+1)+'</span><span class="profileStatus">'+(state.activeSlot===slotIndex+1?"当前使用":(slot?"已保存":"空槽位"))+'</span></div><input class="profileName" maxlength="24" value=""><div class="profileInfo">'+(slot?(count+' 个选项'):'尚未保存配置')+'</div><div class="profileBtns"><button type="button" class="profileSwitch">切换</button><button type="button" class="profileSave">保存当前</button></div>';
      var input=card.querySelector(".profileName");input.value=name;
      var sw=card.querySelector(".profileSwitch");
      var save=card.querySelector(".profileSave");
      sw.disabled=!slot||state.activeSlot===slotIndex+1;
      sw.addEventListener("click",function(){switchTo(slotIndex+1);});
      save.addEventListener("click",function(){saveTo(slotIndex+1,input.value);});
      grid.appendChild(card);
    })(i);
  }
}

function setPanelBusy(on){
  var p=document.getElementById("profilePanel");
  if(!p)return;
  if(!on){render();return;}
  Array.from(p.querySelectorAll("button,input")).forEach(function(el){el.disabled=true;});
}

async function refresh(){
  if(!document.body.classList.contains("adminMode"))return;
  try{var r=await readApi();state=r.doc;render();}catch(e){handleError(e);}
}

async function saveActive(){
  if(!ensureIdle())return;
  try{
    var items=wheelItems();
    if(items.length<2){alert("至少需要 2 个选项。");return;}
    await writeApi(function(doc){
      var idx=doc.activeSlot-1;
      var old=doc.slots[idx];
      doc.slots[idx]={id:idx+1,name:old&&old.name?old.name:("配置 "+(idx+1)),updatedAt:now(),items:cloneItems(items)};
    },"Save active weekend wheel profile");
    window.WeekendWheelApp&&window.WeekendWheelApp.saveLocal&&window.WeekendWheelApp.saveLocal();
    alert("当前配置已保存到槽位 "+state.activeSlot+"。");
  }catch(e){handleError(e);}
}

async function saveTo(slotNo,name){
  if(!ensureIdle())return;
  var items=wheelItems();
  if(items.length<2){alert("至少需要 2 个选项。");return;}
  name=(name||"").trim()||("配置 "+slotNo);
  if(state&&state.slots[slotNo-1]&&slotNo!==state.activeSlot){
    if(!confirm("槽位 "+slotNo+" 已有配置，保存当前轮盘会覆盖它。继续吗？"))return;
  }
  try{
    await writeApi(function(doc){doc.slots[slotNo-1]={id:slotNo,name:name,updatedAt:now(),items:cloneItems(items)};},"Save weekend wheel profile slot "+slotNo);
    alert("已把当前轮盘保存到槽位 "+slotNo+"。");
  }catch(e){handleError(e);}
}

async function switchTo(slotNo){
  if(!ensureIdle())return;
  if(!state||!state.slots[slotNo-1])return;
  var current=state.slots[state.activeSlot-1];
  if(current&&!sameItems(wheelItems(),current.items)){
    if(!confirm("当前轮盘有尚未保存的修改。切换后这些修改会丢失，继续吗？"))return;
  }
  try{
    var next=await writeApi(function(doc){
      if(!doc.slots[slotNo-1])throw new Error("EMPTY_SLOT");
      doc.activeSlot=slotNo;
    },"Switch active weekend wheel profile to slot "+slotNo);
    var target=next&&next.slots[slotNo-1];
    if(target&&window.WeekendWheelApp)window.WeekendWheelApp.setItems(target.items);
  }catch(e){handleError(e);}
}

async function newProfile(){
  if(!ensureIdle())return;
  var raw=prompt("新建到哪个槽位？请输入 1、2 或 3。",state?String(Math.min(3,(state.slots.findIndex(function(s){return!s})+1)||1)):"1");
  if(raw===null)return;
  var slotNo=parseInt(raw,10);
  if(!(slotNo>=1&&slotNo<=3)){alert("请输入 1、2 或 3。");return;}
  if(state&&state.slots[slotNo-1]){
    if(!confirm("槽位 "+slotNo+" 已有配置。新建会覆盖该槽位，但其他槽位不会受影响。继续吗？"))return;
  }
  var name=(prompt("给这份新配置起个名字：","新轮盘 "+slotNo)||"").trim();
  if(!name)return;
  var blank=["新选项 1","新选项 2"];
  try{
    var next=await writeApi(function(doc){
      doc.slots[slotNo-1]={id:slotNo,name:name,updatedAt:now(),items:blank.slice()};
      doc.activeSlot=slotNo;
    },"Create new weekend wheel profile in slot "+slotNo);
    if(next&&window.WeekendWheelApp)window.WeekendWheelApp.setItems(blank);
  }catch(e){handleError(e);}
}

function handleError(e){
  var m=e&&e.message;
  if(m==="NO_TOKEN"||m==="TOKEN")alert("请先进入管理员模式并验证 GitHub 管理凭证。");
  else if(m==="EMPTY_SLOT")alert("这个槽位还没有配置。");
  else if(m==="READ"||m==="WRITE")alert("配置库同步失败，请稍后重试。");
  else alert("配置库操作失败："+(m||"未知错误"));
}

function replaceSaveButton(){
  var old=document.getElementById("saveBtn");
  if(!old||old.dataset.profileOwned==="1")return;
  var fresh=old.cloneNode(true);
  fresh.dataset.profileOwned="1";
  fresh.textContent="保存当前配置";
  old.parentNode.replaceChild(fresh,old);
  fresh.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();saveActive();});
}

function observeAdmin(){
  var last=document.body.classList.contains("adminMode");
  new MutationObserver(function(){
    var on=document.body.classList.contains("adminMode");
    if(on&&!last)refresh();
    last=on;
  }).observe(document.body,{attributes:true,attributeFilter:["class"]});
}

function boot(){
  installStyle();
  buildPanel();
  replaceSaveButton();
  observeAdmin();
  fetch("./config.json?t="+Date.now(),{cache:"no-store"}).then(function(r){return r.ok?r.json():null;}).then(function(d){if(d){state=normalize(d);render();}}).catch(function(){});
}

window.WeekendWheelProfiles={saveActive:saveActive,refresh:refresh};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();

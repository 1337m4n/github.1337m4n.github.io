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
function now(){return new Date().toISOString();}
function cloneItems(arr){return Array.isArray(arr)?arr.map(function(x){return String(x).trim();}).filter(Boolean):[];}
function encode64(s){var a=new TextEncoder().encode(s),x="";for(var i=0;i<a.length;i++)x+=String.fromCharCode(a[i]);return btoa(x);}
function decode64(s){var bin=atob((s||"").replace(/\s/g,"")),a=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return new TextDecoder().decode(a);}
function wheelItems(){return window.WeekendWheelApp&&window.WeekendWheelApp.getItems?cloneItems(window.WeekendWheelApp.getItems()):[];}
function wheelBusy(){try{return!!(window.WeekendWheelRuntime&&window.WeekendWheelRuntime.isBusy&&window.WeekendWheelRuntime.isBusy())}catch(e){return false}}
function sameItems(a,b){a=cloneItems(a);b=cloneItems(b);if(a.length!==b.length)return false;for(var i=0;i<a.length;i++)if(a[i]!==b[i])return false;return true;}
function ensureIdle(){if(wheelBusy()){alert("请先停止转盘，再操作配置库。");return false}return true;}

function normalize(doc){
  doc=doc&&typeof doc==="object"?doc:{};
  var slots=[null,null,null];
  if(Array.isArray(doc.slots)){
    for(var i=0;i<3;i++){
      var s=doc.slots[i];
      var items=s&&cloneItems(s.items);
      if(s&&items.length>=2)slots[i]={id:i+1,name:String(s.name||("配置 "+(i+1))).trim()||("配置 "+(i+1)),updatedAt:s.updatedAt||doc.updatedAt||now(),items:items};
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
  return {version:2,updatedAt:doc.updatedAt||now(),activeSlot:active,items:cloneItems(slots[active-1].items),slots:slots};
}

async function readApi(){
  var t=readToken();
  if(!t)throw new Error("NO_TOKEN");
  var r=await fetch(api()+"?ref="+encodeURIComponent(BRANCH)+"&t="+Date.now(),{headers:headers(t),cache:"no-store"});
  if(!r.ok)throw new Error(r.status===401||r.status===403?"TOKEN":"READ");
  var meta=await r.json(),doc;
  try{doc=JSON.parse(decode64(meta.content));}catch(e){throw new Error("PARSE");}
  return {token:t,sha:meta.sha,doc:normalize(doc)};
}

async function refreshState(){var r=await readApi();state=r.doc;render();return state;}

async function writeApi(mutator,message){
  if(busy)throw new Error("BUSY");
  busy=true;setPanelBusy(true);
  try{
    var current=await readApi();
    var doc=current.doc;
    mutator(doc);
    doc.version=2;doc.updatedAt=now();
    var active=doc.slots[doc.activeSlot-1];
    if(!active||cloneItems(active.items).length<2)throw new Error("BAD_ACTIVE");
    doc.items=cloneItems(active.items);
    var p=await fetch(api(),{method:"PUT",headers:Object.assign({"Content-Type":"application/json"},headers(current.token)),body:JSON.stringify({message:message||"Update wheel profile library",content:encode64(JSON.stringify(doc,null,2)),sha:current.sha,branch:BRANCH})});
    if(!p.ok){if(p.status===401||p.status===403)throw new Error("TOKEN");if(p.status===409||p.status===422)throw new Error("CONFLICT");throw new Error("WRITE");}
    state=normalize(doc);render();return state;
  }finally{busy=false;setPanelBusy(false);}
}

function installStyle(){
  if(document.getElementById("wheelProfileStyle"))return;
  var s=document.createElement("style");s.id="wheelProfileStyle";
  s.textContent=`.profilePanel{display:none!important;margin-top:14px;padding:16px!important}body.adminMode .profilePanel{display:block!important}.profileHead{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}.profileTitle{font-size:16px;font-weight:750;color:var(--text)}.profileHint{font-size:12px;line-height:1.5;color:var(--muted);margin-top:3px}.profileGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.profileCard{border:1px solid rgba(80,103,95,.12);background:rgba(255,255,255,.48);border-radius:16px;padding:12px;box-shadow:inset 0 1px 0 rgba(255,255,255,.8)}.profileCard.active{border-color:rgba(49,123,108,.34);box-shadow:0 0 0 2px rgba(49,123,108,.08),inset 0 1px 0 rgba(255,255,255,.88)}.profileEmpty{opacity:.72}.profileMeta{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px}.profileSlot{font-size:12px;font-weight:750;color:var(--accent-deep)}.profileStatus{font-size:11px;color:var(--muted)}.profileName{width:100%;box-sizing:border-box;border:1px solid rgba(80,103,95,.14);background:rgba(255,255,255,.68);color:var(--text);border-radius:11px;padding:9px 10px;font-size:14px;outline:none}.profileInfo{font-size:12px;color:var(--muted);margin:8px 0 10px;min-height:18px}.profileBtns{display:grid;grid-template-columns:1fr 1fr;gap:7px}.profileBtns button{min-height:38px;padding:8px 9px;font-size:12px}.profileToolbar{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.profileToolbar button{min-height:40px}@media(max-width:760px){.profileGrid{grid-template-columns:1fr}.profilePanel{padding:12px!important}.profileBtns button{min-height:42px}}`;
  document.head.appendChild(s);
}

function buildPanel(){
  if(document.getElementById("profilePanel"))return;
  var p=document.createElement("section");p.id="profilePanel";p.className="panel adminOnlyBlock profilePanel";
  p.innerHTML='<div class="profileHead"><div><div class="profileTitle">轮盘配置库</div><div class="profileHint">最多保存 3 份线上配置。普通访问者只会看到当前启用的配置。</div></div></div><div id="profileGrid" class="profileGrid"></div><div class="profileToolbar"><button type="button" id="newProfileBtn">＋ 新建空白配置</button><button type="button" id="refreshProfilesBtn">刷新配置库</button></div>';
  var editor=document.querySelector(".editorPanel");if(editor&&editor.parentNode)editor.parentNode.insertBefore(p,editor);else document.querySelector(".wrap")&&document.querySelector(".wrap").appendChild(p);
  document.getElementById("newProfileBtn").addEventListener("click",newProfile);document.getElementById("refreshProfilesBtn").addEventListener("click",refresh);
}

function render(){
  var grid=document.getElementById("profileGrid");if(!grid||!state)return;grid.innerHTML="";
  for(var i=0;i<3;i++)(function(idx){
    var slot=state.slots[idx],active=state.activeSlot===idx+1,card=document.createElement("div");card.className="profileCard"+(active?" active":"")+(!slot?" profileEmpty":"");
    card.innerHTML='<div class="profileMeta"><span class="profileSlot">槽位 '+(idx+1)+'</span><span class="profileStatus">'+(active?"当前使用":(slot?"已保存":"空槽位"))+'</span></div><input class="profileName" maxlength="24"><div class="profileInfo">'+(slot?(slot.items.length+' 个选项'):'尚未保存配置')+'</div><div class="profileBtns"><button type="button" class="profileSwitch">切换</button><button type="button" class="profileSave">保存当前</button></div>';
    var input=card.querySelector(".profileName"),sw=card.querySelector(".profileSwitch"),save=card.querySelector(".profileSave");input.value=slot?slot.name:("配置 "+(idx+1));sw.disabled=!slot||active;sw.addEventListener("click",function(){switchTo(idx+1);});save.addEventListener("click",function(){saveTo(idx+1,input.value);});grid.appendChild(card);
  })(i);
}

function setPanelBusy(on){var p=document.getElementById("profilePanel");if(!p)return;if(!on){render();return;}Array.from(p.querySelectorAll("button,input")).forEach(function(el){el.disabled=true;});}
async function refresh(){if(!document.body.classList.contains("adminMode"))return;try{await refreshState();}catch(e){handleError(e);}}

function hasUnsaved(doc){var cur=doc&&doc.slots&&doc.slots[doc.activeSlot-1];return !!(cur&&!sameItems(wheelItems(),cur.items));}
function confirmLoseUnsaved(doc){return !hasUnsaved(doc)||confirm("当前轮盘有尚未保存的修改。继续后这些修改会丢失，是否继续？");}

async function saveActive(){
  if(!ensureIdle())return;var items=wheelItems();if(items.length<2){alert("至少需要 2 个选项。");return;}
  try{var next=await writeApi(function(doc){var idx=doc.activeSlot-1,old=doc.slots[idx];doc.slots[idx]={id:idx+1,name:old&&old.name?old.name:("配置 "+(idx+1)),updatedAt:now(),items:items.slice()};},"Save active weekend wheel profile");if(next){window.WeekendWheelApp&&window.WeekendWheelApp.saveLocal&&window.WeekendWheelApp.saveLocal();alert("当前配置已保存到槽位 "+next.activeSlot+"。");}}catch(e){handleError(e);}
}

async function saveTo(slotNo,name){
  if(!ensureIdle())return;var items=wheelItems();if(items.length<2){alert("至少需要 2 个选项。");return;}name=(name||"").trim()||("配置 "+slotNo);
  try{var fresh=await refreshState();var occupied=fresh.slots[slotNo-1];if(occupied&&slotNo!==fresh.activeSlot&&!confirm("槽位 "+slotNo+" 已有配置，保存当前轮盘会覆盖它。继续吗？"))return;await writeApi(function(doc){doc.slots[slotNo-1]={id:slotNo,name:name,updatedAt:now(),items:items.slice()};},"Save weekend wheel profile slot "+slotNo);alert("已把当前轮盘保存到槽位 "+slotNo+"。");}catch(e){handleError(e);}
}

async function switchTo(slotNo){
  if(!ensureIdle())return;
  try{var fresh=await refreshState();if(!fresh.slots[slotNo-1]){alert("这个槽位还没有配置。");return;}if(!confirmLoseUnsaved(fresh))return;var next=await writeApi(function(doc){if(!doc.slots[slotNo-1])throw new Error("EMPTY_SLOT");doc.activeSlot=slotNo;},"Switch active weekend wheel profile to slot "+slotNo);var target=next&&next.slots[slotNo-1];if(target&&window.WeekendWheelApp)window.WeekendWheelApp.setItems(target.items);}catch(e){handleError(e);}
}

async function newProfile(){
  if(!ensureIdle())return;
  try{
    var fresh=await refreshState();if(!confirmLoseUnsaved(fresh))return;
    var empty=fresh.slots.findIndex(function(s){return!s});var def=empty>=0?empty+1:1;
    var raw=prompt("新建到哪个槽位？请输入 1、2 或 3。",String(def));if(raw===null)return;var slotNo=parseInt(raw,10);if(!(slotNo>=1&&slotNo<=3)){alert("请输入 1、2 或 3。");return;}
    if(fresh.slots[slotNo-1]&&!confirm("槽位 "+slotNo+" 已有配置。新建会覆盖该槽位，但其他槽位不会受影响。继续吗？"))return;
    var name=(prompt("给这份新配置起个名字：","新轮盘 "+slotNo)||"").trim();if(!name)return;var blank=["新选项 1","新选项 2"];
    var next=await writeApi(function(doc){doc.slots[slotNo-1]={id:slotNo,name:name,updatedAt:now(),items:blank.slice()};doc.activeSlot=slotNo;},"Create new weekend wheel profile in slot "+slotNo);if(next&&window.WeekendWheelApp)window.WeekendWheelApp.setItems(blank);
  }catch(e){handleError(e);}
}

function handleError(e){var m=e&&e.message;if(m==="NO_TOKEN"||m==="TOKEN")alert("请先进入管理员模式并验证 GitHub 管理凭证。");else if(m==="EMPTY_SLOT")alert("这个槽位还没有配置。");else if(m==="CONFLICT")alert("线上配置刚被其他操作更新，请刷新配置库后重试。");else if(m==="BUSY")alert("配置库正在处理上一项操作，请稍后再试。");else if(m==="READ"||m==="WRITE")alert("配置库同步失败，请稍后重试。");else alert("配置库操作失败："+(m||"未知错误"));}

function replaceSaveButton(){var old=document.getElementById("saveBtn");if(!old||old.dataset.profileOwned==="1")return;var fresh=old.cloneNode(true);fresh.dataset.profileOwned="1";fresh.textContent="保存当前配置";old.parentNode.replaceChild(fresh,old);fresh.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();saveActive();});}
function observeAdmin(){var last=document.body.classList.contains("adminMode");new MutationObserver(function(){var on=document.body.classList.contains("adminMode");if(on&&!last)refresh();last=on;}).observe(document.body,{attributes:true,attributeFilter:["class"]});}
function boot(){installStyle();buildPanel();replaceSaveButton();observeAdmin();fetch("./config.json?t="+Date.now(),{cache:"no-store"}).then(function(r){return r.ok?r.json():null;}).then(function(d){if(d){state=normalize(d);render();}}).catch(function(){});}

window.WeekendWheelProfiles={saveActive:saveActive,refresh:refresh};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();

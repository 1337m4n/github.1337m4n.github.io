(function(){
"use strict";

var OWNER="1337m4n";
var REPO="github.1337m4n.github.io";
var BRANCH="master";
var CONFIG_PATH="weekend-wheel/config.json";
var TOKEN_KEY="weekendWheelGithubTokenV1";
var adminMode=false;
var wheelRaf=0;
var resizeTimer=0;

function isCompact(){
  return window.matchMedia("(max-width:680px), (max-height:520px)").matches;
}

function injectStyle(){
  if(document.getElementById("weekendWheelMobileStyle")) return;
  var s=document.createElement("style");
  s.id="weekendWheelMobileStyle";
  s.textContent=`
.editorPanel{display:none!important}
.adminOnlyBlock{display:none!important}
body.adminMode .editorPanel{display:block!important}
body.adminMode .adminOnlyBlock{display:block!important}
body.adminMode .adminOnlyBlock.controls{display:flex!important}
.adminActions{display:flex;align-items:center;gap:9px;flex-wrap:wrap;justify-content:flex-end}
.adminEntry{border:1px solid rgba(76,111,99,.16);background:rgba(255,255,255,.46);color:var(--accent-deep);border-radius:999px;padding:7px 11px;font-size:12px;font-weight:650;box-shadow:inset 0 1px 0 rgba(255,255,255,.72);-webkit-backdrop-filter:blur(12px) saturate(140%);backdrop-filter:blur(12px) saturate(140%)}
.adminEntry.active{background:rgba(49,123,108,.12);border-color:rgba(49,123,108,.24)}
.wheelResultBox{margin:16px auto 0;width:min(100%,620px);text-align:center}
.wheelResultBox #result{font-size:clamp(24px,3vw,34px);line-height:1.25;margin-top:6px}
.wheelResultBox #remain{margin-top:8px}
button,.btn,#spinBtn{touch-action:manipulation}
.wheelStage{-webkit-user-select:none;user-select:none}
html{scroll-behavior:smooth}

@media(hover:none){
  button:hover,.btn:hover{border-color:rgba(98,117,108,.18);background:rgba(255,255,255,.60)}
}

@media(max-width:680px){
  html,body{width:100%;max-width:100%;overflow-x:hidden}
  body{background-attachment:scroll!important;overscroll-behavior-y:auto}
  .wrap{width:100%;max-width:none;padding:calc(10px + env(safe-area-inset-top)) 10px calc(18px + env(safe-area-inset-bottom))}
  header{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:start;gap:8px;margin-bottom:10px}
  h1{font-size:21px;line-height:1.18;letter-spacing:-.025em}
  .sub{margin-top:4px;font-size:12px;line-height:1.45}
  .headerActions{gap:6px;justify-content:flex-end;align-items:center}
  .badge{padding:5px 8px;font-size:11px;white-space:nowrap}
  .adminEntry{min-height:36px;padding:6px 10px;font-size:12px;white-space:nowrap}

  .layout{grid-template-columns:1fr!important;gap:10px}
  .panel{border-radius:20px;-webkit-backdrop-filter:blur(16px) saturate(135%);backdrop-filter:blur(16px) saturate(135%);box-shadow:0 10px 30px rgba(31,52,45,.07),inset 0 1px 0 rgba(255,255,255,.78)}
  .wheelPanel{padding:10px 8px 12px!important}
  .sidePanel,.editorPanel{padding:12px!important}
  .sidePanel{margin-top:0}

  .wheelStage{width:min(calc(100vw - 36px),430px)!important;max-width:100%}
  .wheelShell{-webkit-backdrop-filter:blur(14px) saturate(135%);backdrop-filter:blur(14px) saturate(135%);box-shadow:0 16px 38px rgba(30,57,48,.11),0 4px 14px rgba(30,57,48,.05),inset 0 2px 0 rgba(255,255,255,.88)}
  #wheelRotor{filter:drop-shadow(0 7px 12px rgba(29,55,46,.07))}
  .rim{box-shadow:inset 0 0 0 2px rgba(44,87,73,.07),inset 0 0 0 6px rgba(255,255,255,.18),0 1px 0 rgba(255,255,255,.82)}

  .centerDisc{width:84px!important;height:84px!important;box-shadow:0 10px 22px rgba(31,90,77,.19),inset 0 1px 1px rgba(255,255,255,.42),0 0 0 7px rgba(255,255,255,.58),0 0 0 8px rgba(255,255,255,.88)}
  #spinBtn{min-height:0;font-size:17px!important;letter-spacing:.04em}
  .pointerAssembly{right:-4px;width:88px;height:48px}
  .pointerWrap{width:52px;height:48px}
  .pointer{border-top-width:12px;border-bottom-width:12px;border-right-width:28px}
  .pointerNeedle{right:22px;width:60px;height:2px}

  .wheelResultBox{margin:10px auto 0;width:100%;min-height:0!important;padding:13px 12px!important;border-radius:16px}
  .wheelResultBox .kicker{margin-bottom:5px;font-size:12px}
  .wheelResultBox #result{font-size:clamp(22px,7vw,28px);line-height:1.25;margin-top:2px}
  .wheelResultBox #remain{margin-top:6px;font-size:12px}
  .helper{display:none}

  button,.btn{min-height:44px;padding:10px 12px;border-radius:12px;display:inline-flex;align-items:center;justify-content:center}
  .sidePanel>.controls{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:0}
  .sidePanel>div[style*="margin-top:16px"]{margin-top:11px!important;padding:7px 2px 4px}
  .switchLine{min-height:40px;font-size:14px}
  .switchLine input{width:20px;height:20px}
  .sectionTitle{margin:16px 0 8px;font-size:15px}
  .history{gap:7px}
  .hist{min-height:44px;padding:10px 11px;align-items:center}

  .adminOnlyBlock.controls,#adminTools .controls{display:grid!important;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
  .adminOnlyBlock.controls>*,#adminTools .controls>*{width:100%}

  .editorPanel{margin-top:10px!important}
  .editorHead{gap:8px}
  .editorHint{margin-top:5px;font-size:12px}
  .editorCount{min-width:56px;padding:6px 9px;font-size:12px}
  .toolbar{display:grid!important;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0 6px}
  .toolbar button{width:100%}
  .itemRow{grid-template-columns:34px minmax(0,1fr)!important;gap:8px;padding:10px 0}
  .num{width:34px;height:34px;border-radius:10px}
  .itemRow input,.batchBox textarea{font-size:16px}
  .itemRow input{min-height:44px;padding:10px}
  .itemActions{grid-column:1/-1!important;justify-content:flex-end;gap:6px;padding-left:42px;flex-wrap:wrap}
  .itemActions button{min-height:40px;min-width:44px;padding:8px 11px}
  .batchBox{padding:11px;border-radius:14px}
  .batchBox textarea{min-height:135px}
  .footer{padding:14px 0 2px;font-size:11px}
}

@media(max-width:430px){
  .badge{display:none}
}

@media(max-width:390px){
  .wrap{padding-left:8px;padding-right:8px}
  h1{font-size:20px}
  .sub{font-size:11px}
  .wheelStage{width:min(calc(100vw - 30px),390px)!important}
  .centerDisc{width:78px!important;height:78px!important}
  #spinBtn{font-size:16px!important}
  .toolbar{grid-template-columns:1fr!important}
}

@media(max-width:950px) and (max-height:520px) and (orientation:landscape){
  .wrap{padding:calc(6px + env(safe-area-inset-top)) calc(10px + env(safe-area-inset-right)) calc(8px + env(safe-area-inset-bottom)) calc(10px + env(safe-area-inset-left))}
  header{display:flex;align-items:center;margin-bottom:7px}
  .sub{display:none}
  h1{font-size:19px}
  .layout{grid-template-columns:minmax(0,1fr) minmax(240px,.72fr)!important;gap:9px;align-items:start}
  .wheelPanel,.sidePanel{padding:8px!important}
  .wheelStage{width:min(72vh,460px)!important}
  .wheelResultBox{padding:9px 10px!important;margin-top:5px}
  .wheelResultBox #result{font-size:20px}
  .history .hist:nth-child(n+4){display:none}
}

@media(prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  button,.btn,#wheelSvg text{transition:none!important}
}
`;
  document.head.appendChild(s);
}

function readToken(){try{return(localStorage.getItem(TOKEN_KEY)||"").trim()}catch(e){return""}}
function saveToken(t){try{localStorage.setItem(TOKEN_KEY,t)}catch(e){}}
function clearToken(){try{localStorage.removeItem(TOKEN_KEY)}catch(e){}}
function headers(t){return{"Accept":"application/vnd.github+json","Authorization":"Bearer "+t,"X-GitHub-Api-Version":"2022-11-28"}}
function api(){return"https://api.github.com/repos/"+OWNER+"/"+REPO+"/contents/"+CONFIG_PATH}
function b64(s){var a=new TextEncoder().encode(s),x="";for(var i=0;i<a.length;i++)x+=String.fromCharCode(a[i]);return btoa(x)}
function getInputs(){return Array.from(document.querySelectorAll("#editor .itemRow input"))}
function getItems(){return getInputs().map(function(x){return x.value.trim()}).filter(Boolean)}

async function verify(t){
  try{
    var r=await fetch(api()+"?ref="+BRANCH,{headers:headers(t),cache:"no-store"});
    return r.ok;
  }catch(e){return false}
}

function setAdmin(on){
  adminMode=!!on;
  document.body.classList.toggle("adminMode",adminMode);
  var b=document.getElementById("adminBtn");
  if(b){b.textContent=adminMode?"退出管理":"管理员";b.classList.toggle("active",adminMode)}
}

async function enterAdmin(){
  if(adminMode){setAdmin(false);return}
  var t=readToken();
  if(!t){
    t=(prompt("进入管理员模式需要 GitHub 管理凭证。\n\n请输入 Fine-grained personal access token。\n建议仅授权仓库 "+OWNER+"/"+REPO+" 的 Contents: Read and write。\n\nToken 只保存在当前浏览器，不会写入网页源码。")||"").trim();
    if(!t)return;
  }
  var b=document.getElementById("adminBtn");
  if(b){b.disabled=true;b.textContent="验证中…"}
  var ok=await verify(t);
  if(b)b.disabled=false;
  if(!ok){clearToken();setAdmin(false);alert("管理员验证失败。请检查 Token 和仓库 Contents: Read and write 权限。");return}
  saveToken(t);setAdmin(true)
}

function syncUi(arr){
  if(!Array.isArray(arr)||arr.length<2)return;
  var guard=0;
  while(getInputs().length>arr.length&&guard++<100){
    var rows=document.querySelectorAll("#editor .itemRow");
    var row=rows[rows.length-1];
    var del=row&&row.querySelector(".itemActions button:last-child");
    if(!del)break;
    del.click();
  }
  guard=0;
  while(getInputs().length<arr.length&&guard++<100){
    var add=document.getElementById("addBtn");
    if(!add)break;
    add.click();
  }
  var ins=getInputs();
  arr.forEach(function(v,i){
    if(ins[i]){
      ins[i].value=String(v);
      ins[i].dispatchEvent(new Event("change",{bubbles:true}));
    }
  });
}

async function loadRemote(){
  try{
    var r=await fetch("./config.json?t="+Date.now(),{cache:"no-store"});
    if(!r.ok)return;
    var d=await r.json();
    syncUi(Array.isArray(d)?d:d.items);
  }catch(e){}
}

async function saveRemote(e){
  if(e){e.preventDefault();e.stopImmediatePropagation()}
  if(!adminMode){alert("请先进入管理员模式。");return}
  var t=readToken();
  if(!t){setAdmin(false);alert("管理凭证已失效，请重新进入管理员模式。");return}
  var btn=document.getElementById("saveBtn"),old=btn?btn.textContent:"保存线上配置";
  if(btn){btn.disabled=true;btn.textContent="正在同步…"}
  try{
    var m=await fetch(api()+"?ref="+BRANCH,{headers:headers(t),cache:"no-store"});
    if(!m.ok)throw new Error(m.status===401||m.status===403?"TOKEN":"READ");
    var meta=await m.json();
    var body=JSON.stringify({version:1,updatedAt:new Date().toISOString(),items:getItems()},null,2);
    var p=await fetch(api(),{
      method:"PUT",
      headers:Object.assign({"Content-Type":"application/json"},headers(t)),
      body:JSON.stringify({message:"Update weekend wheel shared configuration",content:b64(body),sha:meta.sha,branch:BRANCH})
    });
    if(!p.ok)throw new Error(p.status===401||p.status===403?"TOKEN":"WRITE");
    alert("已保存到线上。其他设备刷新后会读取这份最新配置。");
  }catch(err){
    if(err.message==="TOKEN"){clearToken();setAdmin(false);alert("GitHub Token 无效或权限不足，凭证已清除。")}else{alert("线上保存失败，请稍后重试。")}
  }finally{
    if(btn){btn.disabled=false;btn.textContent=old}
  }
}

function markAdminOnlyBlocks(){
  var panel=document.querySelector(".sidePanel");
  if(!panel)return;
  var titles=panel.querySelectorAll(".sectionTitle");
  for(var i=0;i<titles.length;i++){
    var text=(titles[i].textContent||"").trim();
    if(text==="数据管理"||text==="管理员工具"){
      titles[i].textContent="管理员工具";
      titles[i].classList.add("adminOnlyBlock");
      var controls=titles[i].nextElementSibling;
      var note=controls?controls.nextElementSibling:null;
      if(controls)controls.classList.add("adminOnlyBlock");
      if(note&&note.classList.contains("note"))note.classList.add("adminOnlyBlock");
      break;
    }
  }
}

function moveResultBelowWheel(){
  var resultBox=document.querySelector(".sidePanel .resultBox");
  var wheelStage=document.querySelector(".wheelPanel .wheelStage");
  if(!resultBox||!wheelStage)return;
  resultBox.classList.add("wheelResultBox");
  wheelStage.insertAdjacentElement("afterend",resultBox);
}

function normalizeSpinCopy(){
  var spin=document.getElementById("spinBtn");
  if(spin&&spin.textContent.trim()==="开摇")spin.textContent="开转";
  var result=document.getElementById("result");
  if(result&&result.textContent.trim()==="等你开摇")result.textContent="等你开转";
}

function revealResult(){
  if(!isCompact())return;
  var result=document.getElementById("result");
  var box=result&&result.closest(".wheelResultBox");
  if(!box)return;
  var rect=box.getBoundingClientRect();
  var vh=window.visualViewport?window.visualViewport.height:window.innerHeight;
  if(rect.top<8||rect.bottom>vh-12){
    var reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(function(){box.scrollIntoView({behavior:reduce?"auto":"smooth",block:"center"})},70);
  }
  if(navigator.vibrate){try{navigator.vibrate(10)}catch(e){}}
}

function watchCopyAndResult(){
  var spin=document.getElementById("spinBtn");
  var result=document.getElementById("result");
  normalizeSpinCopy();
  var last=result?(result.textContent||"").trim():"";
  var observer=new MutationObserver(function(){
    normalizeSpinCopy();
    if(!result)return;
    var now=(result.textContent||"").trim();
    if(now!==last){
      if(now&&now!=="等你开转"&&now!=="等你开摇")revealResult();
      last=now;
    }
  });
  if(spin)observer.observe(spin,{childList:true,subtree:true,characterData:true});
  if(result)observer.observe(result,{childList:true,subtree:true,characterData:true});
}

function fixWheelVisuals(){
  var svg=document.getElementById("wheelSvg");
  if(!svg)return;

  var paths=Array.from(svg.children).filter(function(el){return el.tagName&&el.tagName.toLowerCase()==="path"});
  var count=paths.length;
  paths.forEach(function(path,i){
    var fill=(count>2&&count%2===1&&i===count-1)
      ?"var(--accent-softer)"
      :(i%2===0?"var(--wheel-a)":"var(--wheel-b)");
    path.setAttribute("fill",fill);
  });

  var compact=isCompact();
  var font=compact?(count>14?14:(count>10?17:19)):(count>12?12:14);
  Array.from(svg.querySelectorAll("g text")).forEach(function(text){
    text.setAttribute("font-size",String(font));
    if(compact)text.setAttribute("font-weight","650");
  });
}

function scheduleWheelFix(){
  if(wheelRaf)cancelAnimationFrame(wheelRaf);
  wheelRaf=requestAnimationFrame(function(){wheelRaf=0;fixWheelVisuals()});
}

function watchWheel(){
  var svg=document.getElementById("wheelSvg");
  if(!svg)return;
  new MutationObserver(scheduleWheelFix).observe(svg,{childList:true,subtree:true});
  scheduleWheelFix();
  function resized(){
    clearTimeout(resizeTimer);
    resizeTimer=setTimeout(scheduleWheelFix,100);
  }
  window.addEventListener("resize",resized,{passive:true});
  window.addEventListener("orientationchange",resized,{passive:true});
  if(window.visualViewport)window.visualViewport.addEventListener("resize",resized,{passive:true});
}

function setupUi(){
  injectStyle();

  var badge=document.querySelector("header .badge");
  if(badge){
    Array.from(badge.childNodes).forEach(function(n){if(n.nodeType===3)n.nodeValue="线上共享配置"});
  }

  var header=document.querySelector("header");
  if(header&&!document.getElementById("adminBtn")){
    var wrap=document.createElement("div");
    wrap.className="adminActions";
    if(badge){badge.parentNode.insertBefore(wrap,badge);wrap.appendChild(badge)}else{header.appendChild(wrap)}
    var b=document.createElement("button");
    b.id="adminBtn";
    b.className="adminEntry";
    b.type="button";
    b.textContent="管理员";
    b.addEventListener("click",enterAdmin);
    wrap.appendChild(b);
  }

  moveResultBelowWheel();
  markAdminOnlyBlocks();
  watchCopyAndResult();
  watchWheel();

  var save=document.getElementById("saveBtn");
  if(save){save.textContent="保存线上配置";save.addEventListener("click",saveRemote,true)}

  setAdmin(false);
  loadRemote();
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setupUi,{once:true});else setupUi();
})();

(function(){
"use strict";
var OWNER="1337m4n",REPO="github.1337m4n.github.io",BRANCH="master",CONFIG_PATH="weekend-wheel/config.json",TOKEN_KEY="weekendWheelGithubTokenV1",adminMode=false;

function css(){
  var s=document.createElement("style");
  s.textContent=".sidePanel,.editorPanel{display:none!important}body.adminMode .sidePanel{display:block!important}body.adminMode .editorPanel{display:block!important}body:not(.adminMode) .layout{grid-template-columns:1fr!important}body:not(.adminMode) .wheelPanel{max-width:760px;width:100%;margin:0 auto}.adminActions{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.adminEntry{border:1px solid rgba(76,111,99,.16);background:rgba(255,255,255,.46);color:var(--accent-deep);border-radius:999px;padding:7px 11px;font-size:12px;font-weight:650}.adminEntry.active{background:rgba(49,123,108,.12)}";
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

async function verify(t){try{var r=await fetch(api()+"?ref="+BRANCH,{headers:headers(t),cache:"no-store"});return r.ok}catch(e){return false}}
function setAdmin(on){adminMode=!!on;document.body.classList.toggle("adminMode",adminMode);var b=document.getElementById("adminBtn");if(b){b.textContent=adminMode?"退出管理":"管理员";b.classList.toggle("active",adminMode)}}

async function enterAdmin(){
  if(adminMode){setAdmin(false);return}
  var t=readToken();
  if(!t){t=(prompt("进入管理员模式需要 GitHub 管理凭证。\n\n请输入 Fine-grained personal access token。\n建议仅授权仓库 "+OWNER+"/"+REPO+" 的 Contents: Read and write。\n\nToken 只保存在当前浏览器，不会写入网页源码。")||"").trim();if(!t)return}
  var b=document.getElementById("adminBtn");if(b){b.disabled=true;b.textContent="验证中…"}
  var ok=await verify(t);if(b)b.disabled=false;
  if(!ok){clearToken();setAdmin(false);alert("管理员验证失败。请检查 Token 和仓库 Contents: Read and write 权限。");return}
  saveToken(t);setAdmin(true)
}

function syncUi(arr){
  if(!Array.isArray(arr)||arr.length<2)return;
  var guard=0;
  while(getInputs().length>arr.length&&guard++<100){var rows=document.querySelectorAll("#editor .itemRow");var row=rows[rows.length-1];var del=row&&row.querySelector(".itemActions button:last-child");if(!del)break;del.click()}
  guard=0;
  while(getInputs().length<arr.length&&guard++<100){var add=document.getElementById("addBtn");if(!add)break;add.click()}
  var ins=getInputs();
  arr.forEach(function(v,i){if(ins[i]){ins[i].value=String(v);ins[i].dispatchEvent(new Event("change",{bubbles:true}))}})
}
async function loadRemote(){
  try{var r=await fetch("./config.json?t="+Date.now(),{cache:"no-store"});if(!r.ok)return;var d=await r.json();var arr=Array.isArray(d)?d:d.items;syncUi(arr)}catch(e){}
}

async function saveRemote(e){
  if(e){e.preventDefault();e.stopImmediatePropagation()}
  if(!adminMode){alert("请先进入管理员模式。");return}
  var t=readToken();if(!t){setAdmin(false);alert("管理凭证已失效，请重新进入管理员模式。");return}
  var btn=document.getElementById("saveBtn"),old=btn?btn.textContent:"保存线上配置";if(btn){btn.disabled=true;btn.textContent="正在同步…"}
  try{
    var m=await fetch(api()+"?ref="+BRANCH,{headers:headers(t),cache:"no-store"});if(!m.ok)throw new Error(m.status===401||m.status===403?"TOKEN":"READ");var meta=await m.json();
    var body=JSON.stringify({version:1,updatedAt:new Date().toISOString(),items:getItems()},null,2);
    var p=await fetch(api(),{method:"PUT",headers:Object.assign({"Content-Type":"application/json"},headers(t)),body:JSON.stringify({message:"Update weekend wheel shared configuration",content:b64(body),sha:meta.sha,branch:BRANCH})});
    if(!p.ok)throw new Error(p.status===401||p.status===403?"TOKEN":"WRITE");
    alert("已保存到线上。其他设备刷新后会读取这份最新配置。")
  }catch(err){if(err.message==="TOKEN"){clearToken();setAdmin(false);alert("GitHub Token 无效或权限不足，凭证已清除。") }else alert("线上保存失败，请稍后重试。")}
  finally{if(btn){btn.disabled=false;btn.textContent=old}}
}

function ui(){
  css();
  var badge=document.querySelector("header .badge");if(badge){Array.from(badge.childNodes).forEach(function(n){if(n.nodeType===3)n.nodeValue="线上共享配置"})}
  var header=document.querySelector("header");
  if(header&&!document.getElementById("adminBtn")){
    var wrap=document.createElement("div");wrap.className="adminActions";if(badge){badge.parentNode.insertBefore(wrap,badge);wrap.appendChild(badge)}else header.appendChild(wrap);
    var b=document.createElement("button");b.id="adminBtn";b.className="adminEntry";b.type="button";b.textContent="管理员";b.addEventListener("click",enterAdmin);wrap.appendChild(b)
  }
  var save=document.getElementById("saveBtn");if(save){save.textContent="保存线上配置";save.addEventListener("click",saveRemote,true)}
  var title=document.querySelector(".sidePanel .sectionTitle:last-of-type");if(title&&title.textContent.trim()==="数据管理")title.textContent="管理员工具";
  setAdmin(false);
  loadRemote();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",ui,{once:true});else ui();
})();

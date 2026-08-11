(function(){
"use strict";

var OWNER="1337m4n";
var REPO="github.1337m4n.github.io";
var BRANCH="master";
var CONFIG_PATH="weekend-wheel/config.json";
var TOKEN_KEY="weekendWheelGithubTokenV1";
var adminMode=false;

function injectStyle(){
  if(document.getElementById("adminModeStyle")) return;
  var style=document.createElement("style");
  style.id="adminModeStyle";
  style.textContent=[
    ".adminEntry{border:1px solid rgba(76,111,99,.16);background:rgba(255,255,255,.46);color:var(--accent-deep);border-radius:999px;padding:7px 11px;font-size:12px;font-weight:650;box-shadow:inset 0 1px 0 rgba(255,255,255,.72);-webkit-backdrop-filter:blur(12px) saturate(140%);backdrop-filter:blur(12px) saturate(140%)}",
    ".adminEntry.active{background:rgba(49,123,108,.12);border-color:rgba(49,123,108,.24)}",
    ".adminActions{display:flex;align-items:center;gap:9px;flex-wrap:wrap;justify-content:flex-end}",
    ".adminStatus{margin-top:10px;font-size:12px;color:var(--muted)}",
    "@media(max-width:860px){.adminActions{justify-content:flex-start}}"
  ].join("");
  document.head.appendChild(style);
}

function findAdminBlocks(){
  var panel=document.querySelector(".sidePanel");
  var dataTitle=null;
  if(panel){
    var titles=panel.querySelectorAll(".sectionTitle");
    for(var i=0;i<titles.length;i++){
      if((titles[i].textContent||"").trim()==="数据管理"){
        dataTitle=titles[i];
        break;
      }
    }
  }
  var dataControls=dataTitle?dataTitle.nextElementSibling:null;
  var dataNote=dataControls?dataControls.nextElementSibling:null;
  return {
    editor:document.querySelector(".editorPanel"),
    dataTitle:dataTitle,
    dataControls:dataControls,
    dataNote:dataNote
  };
}

function readToken(){
  try{return (localStorage.getItem(TOKEN_KEY)||"").trim();}catch(e){return "";}
}

function storeToken(token){
  try{localStorage.setItem(TOKEN_KEY,token);}catch(e){}
}

function clearToken(){
  try{localStorage.removeItem(TOKEN_KEY);}catch(e){}
}

function authHeaders(token){
  return {
    "Accept":"application/vnd.github+json",
    "Authorization":"Bearer "+token,
    "X-GitHub-Api-Version":"2022-11-28"
  };
}

async function verifyToken(token){
  if(!token) return false;
  try{
    var api="https://api.github.com/repos/"+OWNER+"/"+REPO+"/contents/"+CONFIG_PATH+"?ref="+encodeURIComponent(BRANCH);
    var r=await fetch(api,{method:"GET",headers:authHeaders(token),cache:"no-store"});
    return r.ok;
  }catch(e){
    return false;
  }
}

function utf8ToBase64(str){
  var bytes=new TextEncoder().encode(str);
  var binary="";
  for(var i=0;i<bytes.length;i++) binary+=String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function applyAdminVisibility(){
  var b=findAdminBlocks();
  var display=adminMode?"":"none";
  if(b.editor) b.editor.style.display=display;
  if(b.dataTitle) b.dataTitle.style.display=display;
  if(b.dataControls) b.dataControls.style.display=adminMode?"flex":"none";
  if(b.dataNote) b.dataNote.style.display=display;

  var btn=document.getElementById("adminBtn");
  if(btn){
    btn.textContent=adminMode?"退出管理":"管理员";
    btn.classList.toggle("active",adminMode);
  }
  var status=document.getElementById("adminStatus");
  if(status) status.textContent=adminMode?"管理员模式已开启 · 当前修改可保存到线上":"";
}

function ensureAdminUi(){
  injectStyle();

  var badge=document.querySelector("header .badge");
  if(badge){
    var txt=badge.childNodes;
    for(var i=0;i<txt.length;i++){
      if(txt[i].nodeType===3){ txt[i].nodeValue="线上共享配置"; }
    }
  }

  var header=document.querySelector("header");
  if(header && badge && !document.getElementById("adminBtn")){
    var wrap=document.createElement("div");
    wrap.className="adminActions";
    badge.parentNode.insertBefore(wrap,badge);
    wrap.appendChild(badge);

    var btn=document.createElement("button");
    btn.id="adminBtn";
    btn.type="button";
    btn.className="adminEntry";
    btn.textContent="管理员";
    wrap.appendChild(btn);
    btn.addEventListener("click",enterAdminMode);
  }

  var blocks=findAdminBlocks();
  if(blocks.dataTitle) blocks.dataTitle.textContent="管理员工具";

  if(blocks.dataControls && !document.getElementById("clearCredentialBtn")){
    var clear=document.createElement("button");
    clear.id="clearCredentialBtn";
    clear.type="button";
    clear.textContent="清除管理凭证";
    clear.addEventListener("click",function(){
      if(confirm("清除当前浏览器保存的管理员凭证？")){
        clearToken();
        adminMode=false;
        applyAdminVisibility();
        alert("管理凭证已清除。下次进入管理员模式时需要重新输入 GitHub Token。");
      }
    });
    blocks.dataControls.appendChild(clear);
  }

  if(blocks.dataNote && !document.getElementById("adminStatus")){
    var status=document.createElement("div");
    status.id="adminStatus";
    status.className="adminStatus";
    blocks.dataNote.parentNode.insertBefore(status,blocks.dataNote.nextSibling);
  }

  applyAdminVisibility();
}

async function enterAdminMode(){
  if(adminMode){
    adminMode=false;
    applyAdminVisibility();
    return;
  }

  var token=readToken();
  if(!token){
    token=(prompt(
      "进入管理员模式需要 GitHub 管理凭证。\n\n"+
      "请输入 Fine-grained personal access token。\n"+
      "建议只授权仓库 "+OWNER+"/"+REPO+" 的 Contents: Read and write。\n\n"+
      "Token 只保存在当前浏览器，不会写入网页源码。"
    )||"").trim();
    if(!token) return;
  }

  var btn=document.getElementById("adminBtn");
  if(btn){btn.disabled=true;btn.textContent="验证中…";}
  var ok=await verifyToken(token);
  if(btn) btn.disabled=false;

  if(!ok){
    clearToken();
    adminMode=false;
    applyAdminVisibility();
    alert(
      "管理员验证失败。\n\n"+
      "请确认 GitHub Token 有效，并且对仓库 "+OWNER+"/"+REPO+
      " 具有 Contents: Read and write 权限。"
    );
    return;
  }

  storeToken(token);
  adminMode=true;
  applyAdminVisibility();
}

async function saveSharedConfig(){
  if(!adminMode){
    alert("请先进入管理员模式。");
    return;
  }
  if(!window.WeekendWheelApp) return;

  var token=readToken();
  if(!token){
    adminMode=false;
    applyAdminVisibility();
    alert("管理凭证已失效，请重新进入管理员模式。");
    return;
  }

  var btn=document.getElementById("saveBtn");
  var oldText=btn?btn.textContent:"保存线上配置";
  if(btn){btn.disabled=true;btn.textContent="正在同步…";}

  try{
    var api="https://api.github.com/repos/"+OWNER+"/"+REPO+"/contents/"+CONFIG_PATH;
    var headers=authHeaders(token);
    var metaRes=await fetch(api+"?ref="+encodeURIComponent(BRANCH),{
      method:"GET",headers:headers,cache:"no-store"
    });

    if(!metaRes.ok){
      if(metaRes.status===401||metaRes.status===403) throw new Error("TOKEN_PERMISSION");
      throw new Error("读取线上配置失败："+metaRes.status);
    }

    var meta=await metaRes.json();
    var body=JSON.stringify({
      version:1,
      updatedAt:new Date().toISOString(),
      items:window.WeekendWheelApp.getItems()
    },null,2);

    var put=await fetch(api,{
      method:"PUT",
      headers:Object.assign({"Content-Type":"application/json"},headers),
      body:JSON.stringify({
        message:"Update weekend wheel shared configuration",
        content:utf8ToBase64(body),
        sha:meta.sha,
        branch:BRANCH
      })
    });

    if(!put.ok){
      if(put.status===401||put.status===403) throw new Error("TOKEN_PERMISSION");
      var t="";
      try{t=await put.text();}catch(e){}
      throw new Error("写入失败："+put.status+" "+t.slice(0,120));
    }

    window.WeekendWheelApp.saveLocal();
    alert("已保存到线上。GitHub Pages 通常几十秒内完成发布，其他设备刷新后就会看到最新配置。");
  }catch(e){
    if(e&&e.message==="TOKEN_PERMISSION"){
      clearToken();
      adminMode=false;
      applyAdminVisibility();
      alert("GitHub Token 无效或权限不足，管理凭证已清除。请重新进入管理员模式后输入有效 Token。");
    }else{
      alert("线上保存失败：\n"+(e&&e.message?e.message:String(e)));
    }
  }finally{
    if(btn){btn.disabled=false;btn.textContent=oldText;}
  }
}

function boot(){
  ensureAdminUi();
  if(window.WeekendWheelSync){
    window.WeekendWheelSync.save=saveSharedConfig;
  }else{
    var tries=0;
    var timer=setInterval(function(){
      tries++;
      if(window.WeekendWheelSync){
        window.WeekendWheelSync.save=saveSharedConfig;
        clearInterval(timer);
      }else if(tries>40){
        clearInterval(timer);
      }
    },100);
  }
}

if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded",boot,{once:true});
}else{
  boot();
}

})();

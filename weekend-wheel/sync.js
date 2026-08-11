(function(){
"use strict";

var OWNER="1337m4n";
var REPO="github.1337m4n.github.io";
var BRANCH="master";
var CONFIG_PATH="weekend-wheel/config.json";
var TOKEN_KEY="weekendWheelGithubTokenV1";

function setUi(){
  var btn=document.getElementById("saveBtn");
  if(btn) btn.textContent="保存线上配置";

  var notes=document.querySelectorAll(".sidePanel .note");
  if(notes.length){
    notes[notes.length-1].textContent="页面优先读取线上共享配置。编辑后点击“保存线上配置”，即可同步到域名下所有访问者；本机仍会保留一份离线缓存。";
  }

  var footer=document.querySelector(".footer");
  if(footer) footer.textContent="支持线上共享配置 · 本地离线缓存";
}

function utf8ToBase64(str){
  var bytes=new TextEncoder().encode(str);
  var binary="";
  for(var i=0;i<bytes.length;i++) binary+=String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function getToken(){
  var token="";
  try{token=localStorage.getItem(TOKEN_KEY)||"";}catch(e){}
  if(token) return token;

  token=prompt(
    "首次保存线上配置需要 GitHub Token。\n\n"+
    "建议创建 Fine-grained personal access token，只授权仓库 "+OWNER+"/"+REPO+"，并授予 Contents: Read and write。\n\n"+
    "Token 只会保存在你当前浏览器，不会写进网页源码。"
  )||"";

  token=token.trim();
  if(!token) return "";
  try{localStorage.setItem(TOKEN_KEY,token);}catch(e){}
  return token;
}

async function load(){
  try{
    var r=await fetch("./config.json?t="+Date.now(),{cache:"no-store"});
    if(!r.ok) throw new Error("HTTP "+r.status);
    var data=await r.json();
    var arr=Array.isArray(data)?data:data.items;
    if(!window.WeekendWheelApp || !window.WeekendWheelApp.setItems(arr)){
      throw new Error("配置内容无效");
    }
  }catch(e){
    console.warn("线上配置读取失败，继续使用本地缓存。",e);
  }
}

async function save(){
  if(!window.WeekendWheelApp) return;

  var token=getToken();
  if(!token){
    alert("没有填写 GitHub Token，本次未保存线上配置。");
    return;
  }

  var btn=document.getElementById("saveBtn");
  var oldText=btn?btn.textContent:"保存线上配置";
  if(btn){btn.disabled=true;btn.textContent="正在同步…";}

  try{
    var api="https://api.github.com/repos/"+OWNER+"/"+REPO+"/contents/"+CONFIG_PATH;
    var headers={
      "Accept":"application/vnd.github+json",
      "Authorization":"Bearer "+token,
      "X-GitHub-Api-Version":"2022-11-28"
    };

    var metaRes=await fetch(api+"?ref="+encodeURIComponent(BRANCH),{
      method:"GET",
      headers:headers,
      cache:"no-store"
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
    alert("已同步到线上。其他设备刷新或重新打开转盘后，就会看到最新配置。");
  }catch(e){
    if(e&&e.message==="TOKEN_PERMISSION"){
      alert("GitHub Token 无效或权限不足。请使用 Fine-grained token，并给仓库 "+OWNER+"/"+REPO+" 授予 Contents: Read and write。\n\n如需重新输入 Token，请清除本站浏览器数据后再保存。");
    }else{
      alert("线上保存失败：\n"+(e&&e.message?e.message:String(e)));
    }
  }finally{
    if(btn){btn.disabled=false;btn.textContent=oldText;}
  }
}

window.WeekendWheelSync={load:load,save:save};
setUi();
load();

})();

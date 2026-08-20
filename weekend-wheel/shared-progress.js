(function(){
"use strict";

var OWNER="1337m4n";
var REPO="github.1337m4n.github.io";
var BRANCH="master";
var PATH="weekend-wheel/progress.json";
var TOKEN_KEY="weekendWheelGithubTokenV1";
var activeSlot=0;
var writeQueue=Promise.resolve();
var lastStatus="idle";

function api(){return "https://api.github.com/repos/"+OWNER+"/"+REPO+"/contents/"+PATH;}
function token(){try{return(localStorage.getItem(TOKEN_KEY)||"").trim()}catch(e){return""}}
function headers(t){var h={"Accept":"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28"};if(t)h.Authorization="Bearer "+t;return h;}
function encode64(s){var a=new TextEncoder().encode(s),x="";for(var i=0;i<a.length;i++)x+=String.fromCharCode(a[i]);return btoa(x);}
function decode64(s){var bin=atob((s||"").replace(/\s/g,"")),a=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return new TextDecoder().decode(a);}
function now(){return new Date().toISOString();}
function validSlot(n){n=parseInt(n,10);return n>=1&&n<=3?n:0;}
function emit(status){lastStatus=status;try{window.dispatchEvent(new CustomEvent("weekend-wheel-shared-progress",{detail:{status:status,slot:activeSlot}}));}catch(e){}}

function normalize(doc){
  doc=doc&&typeof doc==="object"?doc:{};
  var slots=[1,2,3].map(function(n){return {slot:n,completed:[]};});
  if(Array.isArray(doc.slots)){
    doc.slots.forEach(function(s,i){
      var n=validSlot(s&&s.slot)||i+1;
      if(!validSlot(n))return;
      var seen={};
      var rows=[];
      (Array.isArray(s&&s.completed)?s.completed:[]).forEach(function(r){
        if(!r||typeof r!=="object")return;
        var key=String(r.key||"");
        var text=String(r.text||"");
        if(!key||seen[key])return;
        seen[key]=true;
        rows.push({key:key,text:text,completedAt:r.completedAt||doc.updatedAt||now()});
      });
      slots[n-1]={slot:n,completed:rows};
    });
  }
  return {version:1,updatedAt:doc.updatedAt||now(),slots:slots};
}

async function readApi(useAuth){
  var t=useAuth?token():"";
  if(useAuth&&!t)throw new Error("NO_TOKEN");
  var r=await fetch(api()+"?ref="+encodeURIComponent(BRANCH)+"&t="+Date.now(),{headers:headers(t),cache:"no-store"});
  if(!r.ok)throw new Error(r.status===401||r.status===403?"TOKEN":"READ");
  var meta=await r.json(),doc;
  try{doc=JSON.parse(decode64(meta.content));}catch(e){throw new Error("PARSE");}
  return {sha:meta.sha,token:t,doc:normalize(doc)};
}

async function readPublic(){
  try{return (await readApi(false)).doc;}catch(e){
    var r=await fetch("./progress.json?t="+Date.now(),{cache:"no-store"});
    if(!r.ok)throw e;
    return normalize(await r.json());
  }
}

async function ensureActiveSlot(){
  var n=validSlot(activeSlot)||validSlot(window.WeekendWheelActiveSlot);
  if(n){activeSlot=n;return n;}
  try{
    var r=await fetch("./config.json?t="+Date.now(),{cache:"no-store"});
    var data=r.ok?await r.json():null;
    n=validSlot(data&&data.activeSlot)||1;
  }catch(e){n=1;}
  activeSlot=n;
  window.WeekendWheelActiveSlot=n;
  if(window.WeekendWheelRuntime&&typeof window.WeekendWheelRuntime.setProfileSlot==="function")window.WeekendWheelRuntime.setProfileSlot(n);
  return n;
}

function rowsFor(doc,slot){return doc&&doc.slots&&doc.slots[slot-1]?doc.slots[slot-1].completed:[];}
function applyRows(rows){
  var rt=window.WeekendWheelRuntime;
  if(!rt||typeof rt.applySharedCompleted!=="function")return false;
  return rt.applySharedCompleted(Array.isArray(rows)?rows:[]);
}

async function refresh(){
  var slot=await ensureActiveSlot();
  emit("loading");
  try{
    var doc=await readPublic();
    applyRows(rowsFor(doc,slot));
    emit("synced");
    return true;
  }catch(e){emit("read-failed");return false;}
}

async function writeMutation(mutator){
  var t=token();
  if(!t)throw new Error("NO_TOKEN");
  for(var attempt=0;attempt<3;attempt++){
    var snap=await readApi(true);
    var doc=snap.doc;
    mutator(doc);
    doc.updatedAt=now();
    var r=await fetch(api(),{
      method:"PUT",
      headers:Object.assign({"Content-Type":"application/json"},headers(snap.token)),
      body:JSON.stringify({message:"Update shared wheel progress",content:encode64(JSON.stringify(doc,null,2)),sha:snap.sha,branch:BRANCH})
    });
    if(r.ok){
      var slot=await ensureActiveSlot();
      applyRows(rowsFor(doc,slot));
      emit("synced");
      return doc;
    }
    if(!(r.status===409||r.status===422))throw new Error(r.status===401||r.status===403?"TOKEN":"WRITE");
  }
  throw new Error("CONFLICT");
}

function enqueue(mutator,silent){
  writeQueue=writeQueue.catch(function(){}).then(function(){emit("writing");return writeMutation(mutator);}).catch(function(e){emit(e&&e.message==="NO_TOKEN"?"local-only":"write-failed");if(!silent)throw e;});
  return writeQueue;
}

function describe(index){
  var rt=window.WeekendWheelRuntime;
  return rt&&typeof rt.describeIndex==="function"?rt.describeIndex(index):null;
}

async function addCompletedByIndex(index,silent){
  var row=describe(index);
  var slot=await ensureActiveSlot();
  if(!row)return false;
  return enqueue(function(doc){
    var s=doc.slots[slot-1];
    s.completed=s.completed.filter(function(x){return x.key!==row.key;});
    s.completed.push({key:row.key,text:row.text,completedAt:now()});
  },silent!==false);
}

async function removeCompletedByIndex(index,silent){
  var row=describe(index);
  var slot=await ensureActiveSlot();
  if(!row)return false;
  return enqueue(function(doc){
    doc.slots[slot-1].completed=doc.slots[slot-1].completed.filter(function(x){return x.key!==row.key;});
  },silent!==false);
}

async function clearSlot(silent){
  var slot=await ensureActiveSlot();
  return enqueue(function(doc){doc.slots[slot-1].completed=[];},silent!==false);
}

async function setSlot(slotNo){
  slotNo=validSlot(slotNo);
  if(!slotNo)return false;
  activeSlot=slotNo;
  window.WeekendWheelActiveSlot=slotNo;
  if(window.WeekendWheelRuntime&&typeof window.WeekendWheelRuntime.setProfileSlot==="function")window.WeekendWheelRuntime.setProfileSlot(slotNo);
  return refresh();
}

async function boot(){
  await ensureActiveSlot();
  await refresh();
}

window.WeekendWheelSharedProgress={
  setSlot:setSlot,
  refresh:refresh,
  addCompletedByIndex:addCompletedByIndex,
  removeCompletedByIndex:removeCompletedByIndex,
  clearSlot:clearSlot,
  canWrite:function(){return !!token();},
  getSlot:function(){return activeSlot;},
  getStatus:function(){return lastStatus;}
};

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();

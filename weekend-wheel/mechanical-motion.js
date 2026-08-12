(function(){
"use strict";

var motionWrap=null;
var rotor=null;
var wasSpinning=false;
var settleTimer=0;
var labelGuardInstalled=false;

function reducedMotion(){
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function installStyle(){
  if(document.getElementById("mechanicalMotionStyle")) return;

  var style=document.createElement("style");
  style.id="mechanicalMotionStyle";
  style.textContent=`
.mechanicalRotorWrap{
  position:absolute;
  inset:4.5%;
  border-radius:50%;
  transform:rotate(0deg);
  transform-origin:50% 50%;
  will-change:transform;
  pointer-events:none;
}
.mechanicalRotorWrap #wheelRotor{
  inset:0!important;
  width:100%;
  height:100%;
}

/* 起步只做很轻的扭矩预载，主旋转仍由核心逻辑控制。 */
.mechanicalRotorWrap.mechanical-running{
  animation:mechanicalInertia 5.4s cubic-bezier(.16,.84,.28,1) both;
}
@keyframes mechanicalInertia{
  0%{transform:rotate(0deg)}
  2.5%{transform:rotate(-1.15deg)}
  7%{transform:rotate(2.25deg)}
  16%{transform:rotate(1.15deg)}
  32%{transform:rotate(.62deg)}
  52%{transform:rotate(.28deg)}
  72%{transform:rotate(.10deg)}
  100%{transform:rotate(0deg)}
}

/* 停下后越过一点、回摆，再收住。 */
.mechanicalRotorWrap.mechanical-settle{
  animation:mechanicalSettle .38s cubic-bezier(.22,.76,.24,1) both;
}
@keyframes mechanicalSettle{
  0%{transform:rotate(0deg)}
  24%{transform:rotate(2.4deg)}
  50%{transform:rotate(-1.1deg)}
  73%{transform:rotate(.42deg)}
  88%{transform:rotate(-.14deg)}
  100%{transform:rotate(0deg)}
}

@media(max-width:680px){
  .mechanicalRotorWrap.mechanical-settle{
    animation-duration:.34s;
  }
  @keyframes mechanicalSettle{
    0%{transform:rotate(0deg)}
    24%{transform:rotate(2.0deg)}
    50%{transform:rotate(-.88deg)}
    73%{transform:rotate(.34deg)}
    88%{transform:rotate(-.11deg)}
    100%{transform:rotate(0deg)}
  }
}

@media(prefers-reduced-motion:reduce){
  .mechanicalRotorWrap.mechanical-running,
  .mechanicalRotorWrap.mechanical-settle{
    animation:none!important;
  }
}
`;
  document.head.appendChild(style);
}

/*
 * 性能保护：核心代码为了让文字始终正向，会在每一帧给所有 SVG 文本 group
 * 重写 transform。桌面端问题不大，但 Safari / 微信 WebView 容易因此掉帧。
 * 旋转中不需要文字保持静止正向，所以只拦截这些 group 的 transform 写入；
 * 转盘停止时 rotor 已移除 is-spinning，核心最后一次 setRotorAngle 会正常写回。
 */
function installLabelWriteGuard(){
  if(labelGuardInstalled || !window.SVGElement) return;
  labelGuardInstalled=true;

  var originalSetAttribute=SVGElement.prototype.setAttribute;
  SVGElement.prototype.setAttribute=function(name,value){
    try{
      if(
        name==="transform" &&
        this.tagName && this.tagName.toLowerCase()==="g" &&
        this.parentNode && this.parentNode.id==="wheelSvg"
      ){
        var liveRotor=document.getElementById("wheelRotor");
        if(liveRotor && liveRotor.classList.contains("is-spinning")){
          return;
        }
      }
    }catch(e){}
    return originalSetAttribute.call(this,name,value);
  };
}

function restartClass(name){
  if(!motionWrap || reducedMotion()) return;
  motionWrap.classList.remove("mechanical-running","mechanical-settle");
  void motionWrap.offsetWidth;
  motionWrap.classList.add(name);
}

function onSpinStart(){
  clearTimeout(settleTimer);
  restartClass("mechanical-running");
}

function onSpinEnd(){
  if(!motionWrap) return;

  motionWrap.classList.remove("mechanical-running");
  void motionWrap.offsetWidth;
  restartClass("mechanical-settle");

  if(navigator.vibrate && !reducedMotion()){
    try{navigator.vibrate([8,26,5]);}catch(e){}
  }

  settleTimer=setTimeout(function(){
    if(motionWrap) motionWrap.classList.remove("mechanical-settle");
  },460);
}

function installRotorLayer(){
  rotor=document.getElementById("wheelRotor");
  if(!rotor) return false;

  if(rotor.parentElement && rotor.parentElement.classList.contains("mechanicalRotorWrap")){
    motionWrap=rotor.parentElement;
    return true;
  }

  motionWrap=document.createElement("div");
  motionWrap.className="mechanicalRotorWrap";
  rotor.parentNode.insertBefore(motionWrap,rotor);
  motionWrap.appendChild(rotor);
  return true;
}

function observeSpinState(){
  if(!rotor) return;

  wasSpinning=rotor.classList.contains("is-spinning");

  new MutationObserver(function(){
    var spinning=rotor.classList.contains("is-spinning");

    if(spinning && !wasSpinning){
      onSpinStart();
    }else if(!spinning && wasSpinning){
      onSpinEnd();
    }

    wasSpinning=spinning;
  }).observe(rotor,{attributes:true,attributeFilter:["class"]});
}

function boot(){
  installStyle();
  installLabelWriteGuard();

  if(!installRotorLayer()){
    setTimeout(boot,80);
    return;
  }

  observeSpinState();
}

if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded",boot,{once:true});
}else{
  boot();
}
})();

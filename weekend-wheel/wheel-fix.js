(function(){
"use strict";

var raf1=0;
var raf2=0;

function installStyle(){
  if(document.getElementById("wheelSectorFixStyle")) return;
  var style=document.createElement("style");
  style.id="wheelSectorFixStyle";
  style.textContent=`
:root{
  --wheel-divider:rgba(70,76,73,.10);
}

/* 毛玻璃质感继续保留在轮盘外壳 */
.wheelPanel{
  background:rgba(255,255,255,.56)!important;
  -webkit-backdrop-filter:blur(22px) saturate(145%)!important;
  backdrop-filter:blur(22px) saturate(145%)!important;
  border:1px solid rgba(255,255,255,.82)!important;
  box-shadow:
    0 18px 48px rgba(37,49,44,.08),
    inset 0 1px 0 rgba(255,255,255,.94)!important;
}

.wheelShell{
  background:
    radial-gradient(circle at 30% 20%,rgba(255,255,255,.98),rgba(255,255,255,.70) 36%,rgba(255,255,255,.48) 72%,rgba(255,255,255,.34))!important;
  -webkit-backdrop-filter:blur(28px) saturate(150%)!important;
  backdrop-filter:blur(28px) saturate(150%)!important;
  border:1px solid rgba(255,255,255,.96)!important;
  box-shadow:
    0 24px 56px rgba(36,48,43,.11),
    0 6px 18px rgba(36,48,43,.055),
    inset 0 2px 0 rgba(255,255,255,.98),
    inset 0 -10px 22px rgba(78,92,86,.045),
    inset 0 0 0 1px rgba(255,255,255,.56)!important;
}

#wheelRotor{
  filter:drop-shadow(0 8px 16px rgba(39,51,46,.07))!important;
}

.rim{
  box-shadow:
    inset 0 0 0 1px rgba(70,82,77,.055),
    inset 0 0 0 6px rgba(255,255,255,.30),
    0 1px 0 rgba(255,255,255,.96)!important;
}

@media(max-width:680px){
  .wheelPanel{
    -webkit-backdrop-filter:blur(18px) saturate(140%)!important;
    backdrop-filter:blur(18px) saturate(140%)!important;
  }
  .wheelShell{
    -webkit-backdrop-filter:blur(20px) saturate(140%)!important;
    backdrop-filter:blur(20px) saturate(140%)!important;
    box-shadow:
      0 16px 36px rgba(36,48,43,.09),
      0 4px 12px rgba(36,48,43,.04),
      inset 0 2px 0 rgba(255,255,255,.98),
      inset 0 -8px 18px rgba(78,92,86,.035)!important;
  }
}
`;
  document.head.appendChild(style);
}

function removeHelperCopy(){
  document.querySelectorAll(".helper").forEach(function(el){
    el.remove();
  });
}

function isCompact(){
  return window.matchMedia("(max-width:680px), (max-height:520px)").matches;
}

function getSectorPaths(svg){
  return Array.from(svg.children).filter(function(el){
    return el.tagName && el.tagName.toLowerCase()==="path";
  });
}

function fontSizeForCount(count){
  var compact=isCompact();
  if(compact){
    if(count<=4) return 21;
    if(count<=6) return 19;
    if(count<=8) return 18;
    if(count<=10) return 17;
    if(count<=12) return 16;
    if(count<=15) return 14;
    if(count<=18) return 12.5;
    return 11;
  }

  if(count<=4) return 20;
  if(count<=6) return 18;
  if(count<=8) return 16.5;
  if(count<=10) return 15;
  if(count<=12) return 14;
  if(count<=15) return 12.5;
  if(count<=18) return 11;
  return 10;
}

function pastelRainbow(index,count){
  /*
    低饱和淡彩虹：从珊瑚粉开始，沿色环顺时针完整走一圈。
    每次数量变化都会按当前 count 重新均分色相，因此不会重复固定 7 色。
  */
  var startHue=350;
  var hue=(startHue + index*(360/count))%360;
  var saturation=isCompact()?44:42;
  var lightness=isCompact()?91:90;
  return "hsl("+hue.toFixed(1)+" "+saturation+"% "+lightness+"%)";
}

function applyWheelEnhancements(){
  var svg=document.getElementById("wheelSvg");
  if(!svg) return;

  var paths=getSectorPaths(svg);
  var count=paths.length;
  if(!count) return;

  paths.forEach(function(path,i){
    path.setAttribute("fill",pastelRainbow(i,count));
    path.setAttribute("stroke","var(--wheel-divider)");
    path.setAttribute("stroke-width","0.95");
    path.setAttribute("stroke-linejoin","round");
  });

  var fontSize=fontSizeForCount(count);
  Array.from(svg.querySelectorAll("g text")).forEach(function(text){
    text.setAttribute("font-size",String(fontSize));
    text.setAttribute("font-weight",count<=8?"650":"600");
  });
}

function scheduleFix(){
  if(raf1) cancelAnimationFrame(raf1);
  if(raf2) cancelAnimationFrame(raf2);
  raf1=requestAnimationFrame(function(){
    raf1=0;
    raf2=requestAnimationFrame(function(){
      raf2=0;
      applyWheelEnhancements();
    });
  });
}

function boot(){
  installStyle();
  removeHelperCopy();

  var svg=document.getElementById("wheelSvg");
  if(!svg){
    setTimeout(boot,80);
    return;
  }

  scheduleFix();

  new MutationObserver(function(){
    scheduleFix();
  }).observe(svg,{childList:true,subtree:true});

  window.addEventListener("resize",scheduleFix,{passive:true});
  window.addEventListener("orientationchange",scheduleFix,{passive:true});
  if(window.visualViewport){
    window.visualViewport.addEventListener("resize",scheduleFix,{passive:true});
  }
}

if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded",boot,{once:true});
}else{
  boot();
}
})();

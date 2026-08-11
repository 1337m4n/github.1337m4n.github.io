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
  --wheel-unified:rgba(199,222,215,.46);
  --wheel-divider:rgba(83,111,101,.16);
}
@media(prefers-color-scheme:dark){
  :root{
    --wheel-unified:rgba(74,102,94,.46);
    --wheel-divider:rgba(255,255,255,.10);
  }
}
`;
  document.head.appendChild(style);
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

function applyWheelEnhancements(){
  var svg=document.getElementById("wheelSvg");
  if(!svg) return;

  var paths=getSectorPaths(svg);
  var count=paths.length;
  if(!count) return;

  paths.forEach(function(path){
    path.setAttribute("fill","var(--wheel-unified)");
    path.setAttribute("stroke","var(--wheel-divider)");
    path.setAttribute("stroke-width","1.25");
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

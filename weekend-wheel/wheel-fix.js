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
  --wheel-c:rgba(166,205,195,.62);
  --wheel-divider:rgba(69,104,92,.22);
}
@media(prefers-color-scheme:dark){
  :root{
    --wheel-c:rgba(77,119,107,.62);
    --wheel-divider:rgba(255,255,255,.14);
  }
}
`;
  document.head.appendChild(style);
}

function getSectorPaths(svg){
  return Array.from(svg.children).filter(function(el){
    return el.tagName && el.tagName.toLowerCase()==="path";
  });
}

function applySectorColors(){
  var svg=document.getElementById("wheelSvg");
  if(!svg) return;

  var paths=getSectorPaths(svg);
  var count=paths.length;
  if(!count) return;

  paths.forEach(function(path,i){
    var fill;

    if(count>2 && count%2===1 && i===count-1){
      /*
        奇数个扇区无法只靠 A/B 两色在闭合圆环中完全交替。
        最后一块使用同一绿色体系中的第三色 C，确保它和
        前一个 B、首个 A 都不会视觉粘连。
      */
      fill="var(--wheel-c)";
    }else{
      fill=(i%2===0)?"var(--wheel-a)":"var(--wheel-b)";
    }

    path.setAttribute("fill",fill);
    path.setAttribute("stroke","var(--wheel-divider)");
    path.setAttribute("stroke-width","1.55");
    path.setAttribute("stroke-linejoin","round");
  });
}

function scheduleFix(){
  if(raf1) cancelAnimationFrame(raf1);
  if(raf2) cancelAnimationFrame(raf2);

  /* 双 rAF：等原有 buildWheel / admin.js 的重绘和校正结束后再覆盖。 */
  raf1=requestAnimationFrame(function(){
    raf1=0;
    raf2=requestAnimationFrame(function(){
      raf2=0;
      applySectorColors();
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
}

if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded",boot,{once:true});
}else{
  boot();
}
})();

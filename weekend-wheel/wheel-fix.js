(function(){
"use strict";

var raf1=0;
var raf2=0;
var spinSnapshot=null;
var highlightTimer=0;

function installStyle(){
  if(document.getElementById("wheelSectorFixStyle")) return;
  var style=document.createElement("style");
  style.id="wheelSectorFixStyle";
  style.textContent=`
:root{
  --wheel-c:rgba(166,205,195,.62);
  --wheel-divider:rgba(69,104,92,.22);
  --winner-gold:#d8ad53;
  --winner-gold-soft:rgba(232,193,102,.18);
}

.winningOverlay{
  position:absolute;
  inset:4.5%;
  width:91%;
  height:91%;
  z-index:9;
  pointer-events:none;
  overflow:visible;
}
.winningPath{
  fill:var(--winner-gold-soft);
  stroke:var(--winner-gold);
  stroke-width:7;
  stroke-linejoin:round;
  vector-effect:non-scaling-stroke;
  filter:drop-shadow(0 0 5px rgba(213,166,64,.72)) drop-shadow(0 0 14px rgba(232,193,102,.42));
  transform-origin:300px 300px;
  animation:winnerGlow 1.65s cubic-bezier(.2,.75,.24,1) both;
}
.winningRing{
  fill:none;
  stroke:rgba(226,182,83,.72);
  stroke-width:4;
  vector-effect:non-scaling-stroke;
  filter:drop-shadow(0 0 8px rgba(224,176,64,.48));
  animation:winnerRing 1.65s ease-out both;
}
@keyframes winnerGlow{
  0%{opacity:0;stroke-width:2}
  18%{opacity:1;stroke-width:9}
  48%{opacity:.82;stroke-width:6}
  72%{opacity:1;stroke-width:7}
  100%{opacity:.72;stroke-width:5}
}
@keyframes winnerRing{
  0%{opacity:0;stroke-width:1}
  22%{opacity:.9;stroke-width:5}
  55%{opacity:.45;stroke-width:3}
  100%{opacity:0;stroke-width:1}
}
@media(prefers-color-scheme:dark){
  :root{
    --wheel-c:rgba(77,119,107,.62);
    --wheel-divider:rgba(255,255,255,.14);
    --winner-gold:#e2bf6f;
    --winner-gold-soft:rgba(226,191,111,.16);
  }
}
@media(prefers-reduced-motion:reduce){
  .winningPath,.winningRing{animation:none!important}
  .winningPath{opacity:.78;stroke-width:5}
  .winningRing{display:none}
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

  paths.forEach(function(path,i){
    var fill;
    if(count>2 && count%2===1 && i===count-1){
      fill="var(--wheel-c)";
    }else{
      fill=(i%2===0)?"var(--wheel-a)":"var(--wheel-b)";
    }
    path.setAttribute("fill",fill);
    path.setAttribute("stroke","var(--wheel-divider)");
    path.setAttribute("stroke-width","1.55");
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

function normalizeLabel(s){
  return String(s||"").replace(/\s+/g," ").trim();
}

function captureSpinSnapshot(){
  var svg=document.getElementById("wheelSvg");
  var spin=document.getElementById("spinBtn");
  if(!svg||!spin) return;

  var paths=getSectorPaths(svg);
  if(!paths.length) return;

  var labels=Array.from(svg.querySelectorAll("g text")).map(function(t){
    return normalizeLabel(t.textContent);
  });

  spinSnapshot={
    count:paths.length,
    paths:paths.map(function(p){return p.getAttribute("d")||"";}),
    labels:labels
  };

  clearWinnerHighlight();
}

function findWinnerIndex(resultText){
  if(!spinSnapshot) return -1;
  var full=normalizeLabel(resultText);
  if(!full) return -1;

  var exact=spinSnapshot.labels.indexOf(full);
  if(exact>=0) return exact;

  for(var i=0;i<spinSnapshot.labels.length;i++){
    var label=spinSnapshot.labels[i];
    var prefix=label.endsWith("…")?label.slice(0,-1):label;
    if(prefix && (full.indexOf(prefix)===0 || full===prefix)) return i;
  }
  return -1;
}

function clearWinnerHighlight(){
  clearTimeout(highlightTimer);
  highlightTimer=0;
  var old=document.querySelector(".winningOverlay");
  if(old) old.remove();
}

function showWinnerHighlight(resultText){
  if(!spinSnapshot) return;

  var winnerIndex=findWinnerIndex(resultText);
  if(winnerIndex<0 || winnerIndex>=spinSnapshot.paths.length) return;

  clearWinnerHighlight();

  var stage=document.querySelector(".wheelStage");
  if(!stage) return;

  var ns="http://www.w3.org/2000/svg";
  var overlay=document.createElementNS(ns,"svg");
  overlay.setAttribute("viewBox","0 0 600 600");
  overlay.setAttribute("aria-hidden","true");
  overlay.classList.add("winningOverlay");

  var slice=360/spinSnapshot.count;
  var desired=((90-winnerIndex*slice)%360+360)%360;

  var path=document.createElementNS(ns,"path");
  path.setAttribute("d",spinSnapshot.paths[winnerIndex]);
  path.setAttribute("transform","rotate("+desired+" 300 300)");
  path.classList.add("winningPath");
  overlay.appendChild(path);

  var ring=document.createElementNS(ns,"circle");
  ring.setAttribute("cx","300");
  ring.setAttribute("cy","300");
  ring.setAttribute("r","286");
  ring.classList.add("winningRing");
  overlay.appendChild(ring);

  stage.appendChild(overlay);

  highlightTimer=setTimeout(function(){
    if(overlay&&overlay.parentNode){
      overlay.style.transition="opacity .42s ease";
      overlay.style.opacity="0";
      setTimeout(function(){if(overlay.parentNode)overlay.remove();},450);
    }
  },2100);
}

function watchResult(){
  var result=document.getElementById("result");
  if(!result) return;

  var last=normalizeLabel(result.textContent);
  new MutationObserver(function(){
    var now=normalizeLabel(result.textContent);
    if(now===last) return;
    last=now;

    if(now && now!=="等你开转" && now!=="等你开摇"){
      showWinnerHighlight(now);
    }else{
      clearWinnerHighlight();
    }
  }).observe(result,{childList:true,subtree:true,characterData:true});
}

function boot(){
  installStyle();

  var svg=document.getElementById("wheelSvg");
  var spin=document.getElementById("spinBtn");
  if(!svg||!spin){
    setTimeout(boot,80);
    return;
  }

  spin.addEventListener("click",captureSpinSnapshot,true);
  watchResult();
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

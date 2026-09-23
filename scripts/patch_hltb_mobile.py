#!/usr/bin/env python3
from pathlib import Path
import sys

if len(sys.argv) != 3:
    raise SystemExit("usage: patch_hltb_mobile.py <source-index.html> <target-index.html>")

src = Path(sys.argv[1])
dst = Path(sys.argv[2])
html = src.read_text(encoding="utf-8")

CSS_MARK = "/* HLTB_MOBILE_ADAPT_V1 */"
JS_MARK = "/* HLTB_MOBILE_ADAPT_V1_JS */"

# Ensure notch / Dynamic Island safe-area support is enabled.
if 'name="viewport"' in html and 'viewport-fit=cover' not in html:
    html = html.replace(
        '<meta name="viewport" content="width=device-width,initial-scale=1">',
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">',
        1,
    )

css = r'''
/* HLTB_MOBILE_ADAPT_V1 */
:root{
  --safe-top:env(safe-area-inset-top,0px);
  --safe-right:env(safe-area-inset-right,0px);
  --safe-bottom:env(safe-area-inset-bottom,0px);
  --safe-left:env(safe-area-inset-left,0px);
  --app-vh:100dvh;
}

html{
  min-height:100%;
  scroll-padding-top:calc(var(--bar) + var(--safe-top) + 14px);
  -webkit-text-size-adjust:100%;
  text-size-adjust:100%;
}
body{
  min-height:100vh;
  min-height:100dvh;
  overscroll-behavior-y:auto;
  -webkit-tap-highlight-color:transparent;
}

.bar{
  padding-left:calc(18px + var(--safe-left));
  padding-right:calc(18px + var(--safe-right));
}

.toc{
  height:calc(var(--app-vh, 100dvh) - var(--bar));
  padding-left:calc(18px + var(--safe-left));
  -webkit-overflow-scrolling:touch;
  overscroll-behavior:contain;
}

main{
  padding-left:calc(40px + var(--safe-left));
  padding-right:calc(40px + var(--safe-right));
  padding-bottom:calc(140px + var(--safe-bottom));
}

#top{
  right:calc(16px + var(--safe-right));
  bottom:calc(16px + var(--safe-bottom));
}

button,.btn,.jump,.search input,.toc .gt,.toc a{
  touch-action:manipulation;
}

.toc .gt::after,
#top{
  will-change:transform,opacity;
  transform:translateZ(0);
  backface-visibility:hidden;
}

@supports (content-visibility:auto){
  .card{
    content-visibility:auto;
    contain-intrinsic-size:auto 360px;
  }
}

@media (hover:none) and (pointer:coarse){
  .btn,.jump{
    min-height:40px;
  }
  #top{
    width:46px;
    height:46px;
  }
  a,button,.btn,.jump,input,select{
    -webkit-tap-highlight-color:transparent;
  }
}

@media (max-width:1080px){
  main{
    padding-left:calc(22px + var(--safe-left));
    padding-right:calc(22px + var(--safe-right));
    padding-bottom:calc(130px + var(--safe-bottom));
  }
}

@media (max-width:820px){
  .bar{
    padding-top:calc(8px + var(--safe-top));
    padding-right:calc(12px + var(--safe-right));
    padding-bottom:8px;
    padding-left:calc(12px + var(--safe-left));
  }

  main{
    padding-top:16px;
    padding-right:calc(13px + var(--safe-right));
    padding-bottom:calc(110px + var(--safe-bottom));
    padding-left:calc(13px + var(--safe-left));
  }

  .search input{
    font-size:16px;
    min-height:40px;
  }

  .btn,.jump{
    height:40px;
    min-height:40px;
  }

  .card{
    scroll-margin-top:calc(var(--bar) + var(--safe-top) + 10px);
  }

  .sec-h{
    scroll-margin-top:calc(var(--bar) + var(--safe-top) + 10px);
  }

  #top{
    right:calc(12px + var(--safe-right));
    bottom:calc(12px + var(--safe-bottom));
  }
}

@media (max-width:380px){
  .bar{
    padding-right:calc(9px + var(--safe-right));
    padding-left:calc(9px + var(--safe-left));
  }
  main{
    padding-right:calc(10px + var(--safe-right));
    padding-left:calc(10px + var(--safe-left));
  }
  .btn,.jump{
    height:38px;
    min-height:38px;
  }
}

@media (orientation:landscape) and (max-height:520px){
  .bar{
    padding-top:calc(5px + var(--safe-top));
    padding-bottom:5px;
  }
  main{
    padding-left:calc(16px + var(--safe-left));
    padding-right:calc(16px + var(--safe-right));
  }
  #top{
    right:calc(10px + var(--safe-right));
    bottom:calc(10px + var(--safe-bottom));
  }
}

html[data-platform="ios"] .search input{
  border-radius:10px;
}
html[data-platform="ios"] .btn,
html[data-platform="ios"] .jump{
  border-radius:10px;
}

html[data-platform="android"] .btn,
html[data-platform="android"] .jump{
  border-radius:9px;
}

@media (prefers-reduced-motion:reduce){
  html{scroll-behavior:auto!important}
  *,*::before,*::after{
    animation-duration:.001ms!important;
    animation-iteration-count:1!important;
    transition-duration:.001ms!important;
    scroll-behavior:auto!important;
  }
}

@media print{
  .card{
    content-visibility:visible!important;
    contain-intrinsic-size:auto!important;
  }
}
'''

js = r'''
<script>
/* HLTB_MOBILE_ADAPT_V1_JS */
(function(){
  "use strict";

  var root=document.documentElement;
  var ua=navigator.userAgent||"";
  var platform="other";

  if(/iPhone|iPad|iPod/i.test(ua) ||
     (navigator.platform==="MacIntel" && navigator.maxTouchPoints>1)){
    platform="ios";
  }else if(/Android/i.test(ua)){
    platform="android";
  }
  root.setAttribute("data-platform",platform);

  var raf=0;
  function updateViewportHeight(){
    if(raf) cancelAnimationFrame(raf);
    raf=requestAnimationFrame(function(){
      raf=0;
      var h=(window.visualViewport && window.visualViewport.height) || window.innerHeight;
      if(h>0) root.style.setProperty("--app-vh",Math.round(h)+"px");
    });
  }

  updateViewportHeight();
  window.addEventListener("resize",updateViewportHeight,{passive:true});
  window.addEventListener("orientationchange",function(){
    setTimeout(updateViewportHeight,80);
  },{passive:true});

  if(window.visualViewport){
    window.visualViewport.addEventListener("resize",updateViewportHeight,{passive:true});
  }
})();
</script>
'''

if CSS_MARK not in html:
    if "</style>" not in html:
        raise SystemExit("cannot patch mobile CSS: </style> not found")
    html = html.replace("</style>", css + "\n</style>", 1)

if JS_MARK not in html:
    if "</body>" not in html:
        raise SystemExit("cannot patch mobile JS: </body> not found")
    html = html.replace("</body>", js + "\n</body>", 1)

dst.parent.mkdir(parents=True, exist_ok=True)
dst.write_text(html, encoding="utf-8")

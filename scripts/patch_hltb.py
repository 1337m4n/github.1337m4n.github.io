#!/usr/bin/env python3
from pathlib import Path
import sys

if len(sys.argv) != 3:
    raise SystemExit("usage: patch_hltb.py <source-index.html> <target-index.html>")

src = Path(sys.argv[1])
dst = Path(sys.argv[2])
html = src.read_text(encoding="utf-8")

CSS_MARK = "/* HLTB_COLLAPSIBLE_TOC_V1 */"
JS_MARK = "/* HLTB_COLLAPSIBLE_TOC_V1_JS */"

css = r'''
/* HLTB_COLLAPSIBLE_TOC_V1 */
.toc .gt{
  position:relative;
  align-items:center;
  gap:8px;
  min-height:34px;
  margin:0;
  padding:7px 28px 7px 8px;
  border-radius:8px;
  cursor:pointer;
  user-select:none;
  transition:background .16s ease,color .16s ease;
}
.toc .gt:hover{background:var(--bg-elv)}
.toc .gt:focus-visible{outline:2px solid var(--brand-1);outline-offset:2px}
.toc .gt::after{
  content:"";
  position:absolute;
  right:10px;
  top:50%;
  width:7px;
  height:7px;
  border-right:1.5px solid var(--t3);
  border-bottom:1.5px solid var(--t3);
  transform:translateY(-65%) rotate(45deg);
  transition:transform .18s ease;
}
.toc .grp.is-collapsed .gt::after{
  transform:translateY(-35%) rotate(-45deg);
}
.toc .grp>a{
  max-height:80px;
  opacity:1;
  overflow:hidden;
  transition:max-height .18s ease,opacity .14s ease,padding .18s ease,margin .18s ease;
}
.toc .grp.is-collapsed>a{
  max-height:0 !important;
  opacity:0;
  padding-top:0;
  padding-bottom:0;
  margin-top:0;
  margin-bottom:0;
  pointer-events:none;
}
.toc .grp.has-active>.gt{
  background:var(--brand-soft);
  color:var(--brand-1);
}
.toc .grp.has-active>.gt small{color:var(--brand-1)}
'''

js = r'''
<script>
/* HLTB_COLLAPSIBLE_TOC_V1_JS */
(function(){
  "use strict";
  var KEY="hltb-toc-collapsed-v1";
  var toc=document.querySelector(".toc");
  if(!toc) return;
  var groups=[].slice.call(toc.querySelectorAll(".grp"));
  if(!groups.length) return;

  function sectionId(grp){
    var a=grp.querySelector('a[href^="#s"]');
    if(!a) return "";
    var m=(a.getAttribute("href")||"").match(/^#s(\d+)-/);
    return m ? "sec"+m[1] : "";
  }

  function loadState(){
    try{
      var v=JSON.parse(localStorage.getItem(KEY)||"{}");
      return v && typeof v==="object" ? v : {};
    }catch(e){return {};}
  }
  var saved=loadState();

  function saveState(){
    var out={};
    groups.forEach(function(g){
      var id=sectionId(g);
      if(id) out[id]=g.classList.contains("is-collapsed");
    });
    try{localStorage.setItem(KEY,JSON.stringify(out));}catch(e){}
  }

  function setCollapsed(grp,collapsed,persist){
    grp.classList.toggle("is-collapsed",!!collapsed);
    var gt=grp.querySelector(".gt");
    if(gt) gt.setAttribute("aria-expanded",String(!collapsed));
    if(persist!==false) saveState();
  }

  groups.forEach(function(grp,i){
    var gt=grp.querySelector(".gt");
    if(!gt) return;
    gt.setAttribute("role","button");
    gt.setAttribute("tabindex","0");

    var id=sectionId(grp);
    var collapsed = Object.prototype.hasOwnProperty.call(saved,id) ? !!saved[id] : i!==0;
    setCollapsed(grp,collapsed,false);

    function toggle(){
      setCollapsed(grp,!grp.classList.contains("is-collapsed"),true);
    }
    gt.addEventListener("click",toggle);
    gt.addEventListener("keydown",function(e){
      if(e.key==="Enter" || e.key===" "){
        e.preventDefault();
        toggle();
      }
    });
  });

  function revealActive(){
    var active=toc.querySelector("a.active");
    groups.forEach(function(g){g.classList.remove("has-active");});
    if(!active) return;
    var grp=active.closest(".grp");
    if(!grp) return;
    grp.classList.add("has-active");
    if(grp.classList.contains("is-collapsed")){
      setCollapsed(grp,false,false);
    }
  }

  var mo=new MutationObserver(function(ms){
    for(var i=0;i<ms.length;i++){
      if(ms[i].type==="attributes" && ms[i].attributeName==="class"){
        revealActive();
        break;
      }
    }
  });
  toc.querySelectorAll("a").forEach(function(a){
    mo.observe(a,{attributes:true,attributeFilter:["class"]});
    a.addEventListener("click",function(){
      var grp=a.closest(".grp");
      if(grp) setCollapsed(grp,false,false);
    });
  });

  revealActive();
})();
</script>
'''

if CSS_MARK not in html:
    if "</style>" not in html:
        raise SystemExit("cannot patch CSS: </style> not found")
    html = html.replace("</style>", css + "\n</style>", 1)

if JS_MARK not in html:
    if "</body>" not in html:
        raise SystemExit("cannot patch JS: </body> not found")
    html = html.replace("</body>", js + "\n</body>", 1)

dst.parent.mkdir(parents=True, exist_ok=True)
dst.write_text(html, encoding="utf-8")

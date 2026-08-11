(function(){
"use strict";

function installGuard(){
  if(document.getElementById("weekendWheelMobileAdminGuard")) return;

  var style=document.createElement("style");
  style.id="weekendWheelMobileAdminGuard";
  style.textContent=`
/* Mobile admin visibility hard guard */
@media(max-width:680px){
  body:not(.adminMode) .adminOnlyBlock,
  body:not(.adminMode) .adminOnlyBlock.controls,
  body:not(.adminMode) #adminTools,
  body:not(.adminMode) #adminTools .controls,
  body:not(.adminMode) .editorPanel{
    display:none!important;
  }

  body.adminMode .adminOnlyBlock.controls,
  body.adminMode #adminTools .controls{
    display:grid!important;
    grid-template-columns:1fr 1fr;
    gap:8px;
    margin-top:10px;
  }

  body.adminMode .adminOnlyBlock.controls>*,
  body.adminMode #adminTools .controls>*{
    width:100%;
  }
}

@media(max-width:390px){
  body.adminMode .adminOnlyBlock.controls,
  body.adminMode #adminTools .controls{
    grid-template-columns:1fr!important;
  }
}
`;
  document.head.appendChild(style);
}

if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded",installGuard,{once:true});
}else{
  installGuard();
}
})();

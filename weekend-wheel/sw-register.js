(function(){
  "use strict";

  if (!("serviceWorker" in navigator)) return;
  if (!(location.protocol === "https:" || location.hostname === "localhost")) return;

  function refreshServiceWorker(){
    navigator.serviceWorker
      .register("./sw.js?b=20260820-1100", {
        scope: "./",
        updateViaCache: "none"
      })
      .then(function(registration){
        return registration.update();
      })
      .catch(function(){});
  }

  if (document.readyState === "complete") refreshServiceWorker();
  else window.addEventListener("load", refreshServiceWorker, { once: true });
})();

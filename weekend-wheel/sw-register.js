(function(){
  "use strict";

  if (!("serviceWorker" in navigator)) return;
  if (!(location.protocol === "https:" || location.hostname === "localhost")) return;

  function refreshServiceWorker(){
    navigator.serviceWorker
      .register("./sw.js?b=20260812-0900", {
        scope: "./",
        updateViaCache: "none"
      })
      .then(function(registration){
        /* 每次打开主动检查更新，但不主动重载正在使用的页面。 */
        return registration.update();
      })
      .catch(function(){});
  }

  if (document.readyState === "complete") {
    refreshServiceWorker();
  } else {
    window.addEventListener("load", refreshServiceWorker, { once: true });
  }
})();

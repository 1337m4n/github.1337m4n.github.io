(function(){
  "use strict";

  if (!("serviceWorker" in navigator)) return;
  if (!(location.protocol === "https:" || location.hostname === "localhost")) return;

  function refreshServiceWorker(){
    navigator.serviceWorker
      .register("./sw.js?b=20260812-0840", {
        scope: "./",
        updateViaCache: "none"
      })
      .then(function(registration){
        /* 每次打开都主动检查一次，不等 Safari 自己的更新周期。 */
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

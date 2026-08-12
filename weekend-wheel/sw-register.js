(function(){
  "use strict";

  if (!("serviceWorker" in navigator)) return;
  if (!(location.protocol === "https:" || location.hostname === "localhost")) return;

  /* 唯一的 Service Worker 注册入口；页面分片中的旧注册会在组装时移除。 */
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

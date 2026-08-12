const CACHE_NAME = "weekend-wheel-pwa-v14-20260812-0840";
const APP_PREFIX = "/weekend-wheel/";

/*
 * 更新策略：
 * 1. 新 SW 立即进入激活阶段；
 * 2. 激活时删除此前所有 weekend-wheel 缓存；
 * 3. 立即接管现有页面，并让旧页面自动重新导航一次；
 * 4. 在线时所有站内资源始终网络优先，只在断网时回退缓存。
 */
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.startsWith("weekend-wheel-") && key !== CACHE_NAME)
        .map((key) => caches.delete(key))
    );

    await self.clients.claim();

    /*
     * 这是解决旧 Safari 页面一直停在旧 UI 的关键：
     * 新 SW 一旦激活，主动让已经打开的转盘页面重新走一次导航。
     */
    const windows = await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true
    });

    await Promise.all(
      windows.map(async (client) => {
        try {
          const url = new URL(client.url);
          if (url.origin === self.location.origin && url.pathname.startsWith(APP_PREFIX)) {
            await client.navigate(client.url);
          }
        } catch (e) {}
      })
    );
  })());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(APP_PREFIX)) return;

  event.respondWith((async () => {
    try {
      /* GitHub Pages 在线时永远取最新版本，绕开 HTTP 缓存。 */
      const response = await fetch(event.request, { cache: "no-store" });

      if (response && response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(event.request, response.clone());
      }

      return response;
    } catch (e) {
      /* 只有网络真的不可用时才使用最近一次成功资源。 */
      const cached = await caches.match(event.request);
      if (cached) return cached;

      if (event.request.mode === "navigate") {
        const index = await caches.match(new URL("./index.html", self.location.href).href);
        if (index) return index;
      }

      throw e;
    }
  })());
});

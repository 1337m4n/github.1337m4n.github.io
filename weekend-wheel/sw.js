const CACHE_NAME = "weekend-wheel-pwa-v15-20260812-0900";
const APP_PREFIX = "/weekend-wheel/";

/*
 * 安全更新策略：
 * 1. 新 SW 立即激活；
 * 2. 激活时清理旧的 weekend-wheel 缓存；
 * 3. 接管后不主动 navigate 当前页面，避免用户点击转盘时被强制重载；
 * 4. 在线时站内资源网络优先，断网才回退缓存。
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
  })());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(APP_PREFIX)) return;

  event.respondWith((async () => {
    try {
      const response = await fetch(event.request, { cache: "no-store" });

      if (response && response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(event.request, response.clone());
      }

      return response;
    } catch (e) {
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

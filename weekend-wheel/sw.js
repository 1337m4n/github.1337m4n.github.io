const CACHE_NAME = "weekend-wheel-pwa-v19-20260820-1058";
const APP_PREFIX = "/weekend-wheel/";

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

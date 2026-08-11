const CACHE_NAME = "weekend-wheel-pwa-v9";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./sync.js",
  "./admin.js",
  "./mobile-guard.js",
  "./wheel-fix.js",
  "./mechanical-motion.js",
  "./chunks/part-00.txt",
  "./chunks/part-01.txt",
  "./chunks/part-02.txt",
  "./chunks/part-03.txt",
  "./chunks/part-04.txt",
  "./chunks/part-05.txt",
  "./chunks/part-06.txt"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.endsWith("/weekend-wheel/config.json")) {
    event.respondWith(
      fetch(event.request,{cache:"no-store"})
        .catch(()=>caches.match("./config.json"))
    );
    return;
  }

  if(event.request.mode==="navigate"){
    event.respondWith(
      fetch(event.request,{cache:"no-store"})
        .catch(()=>caches.match("./index.html"))
    );
    return;
  }

  if(
    url.pathname.endsWith("/weekend-wheel/admin.js") ||
    url.pathname.endsWith("/weekend-wheel/mobile-guard.js") ||
    url.pathname.endsWith("/weekend-wheel/wheel-fix.js") ||
    url.pathname.endsWith("/weekend-wheel/mechanical-motion.js") ||
    url.pathname.endsWith("/weekend-wheel/sync.js") ||
    url.pathname.includes("/weekend-wheel/chunks/")
  ){
    event.respondWith(
      fetch(event.request,{cache:"no-store"})
        .then(r=>{
          if(r.ok)caches.open(CACHE_NAME).then(c=>c.put(event.request,r.clone()));
          return r;
        })
        .catch(()=>caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(c=>c||fetch(event.request))
  );
});

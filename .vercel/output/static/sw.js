const CACHE = "print-shell-v3";
const CORE = ["/", "/manifest.webmanifest", "/apple-touch-icon.png", "/icon-192.png", "/icon-512.png", "/favicon.svg"];

function isAppCode(request) {
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  return request.mode === "navigate" || url.pathname === "/" || /\.(html|js|mjs|css)$/.test(url.pathname);
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(CACHE);
      cache.put(request, response.clone()).catch(() => undefined);
    }
    return response;
  } catch {
    const hit = await caches.match(request);
    if (hit) return hit;
    if (request.mode === "navigate") {
      const home = await caches.match("/");
      if (home) return home;
      return new Response("<!doctype html><meta charset=utf-8><p>네트워크에 다시 연결하거나 새로고침해 주세요.</p>", {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
    return Response.error();
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(CORE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (isAppCode(request)) event.respondWith(networkFirst(request));
});

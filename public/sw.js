const CACHE = "print-shell-v9";
const CORE = ["/", "/manifest.webmanifest", "/apple-touch-icon.png", "/icon-192.png", "/icon-512.png", "/favicon.svg"];
/* 오프라인 자립: 인터넷이 끊긴 사내·학교 와이파이에서도 한글 PDF와 PC 도우미 받기가 되게 미리 담는다 */
const OFFLINE_CORE = [
  "/pdfjs/cmaps/Adobe-Korea1-UCS2.bcmap",
  "/pdfjs/cmaps/UniKS-UTF16-H.bcmap",
  "/pdfjs/cmaps/UniKS-UCS2-H.bcmap",
  "/pdfjs/cmaps/KSCms-UHC-H.bcmap",
  "/raw-print-helper.mjs",
];

function isAppCode(request) {
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  return request.mode === "navigate" || url.pathname === "/" || /\.(html|js|mjs|css)$/.test(url.pathname);
}

/** PDF 엔진 자원(CMap·표준 글꼴): 바뀌지 않으므로 캐시 우선, 없으면 받아서 담는다 */
async function cacheFirst(request) {
  const hit = await caches.match(request);
  if (hit) return hit;
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(CACHE);
      cache.put(request, response.clone()).catch(() => undefined);
    }
    return response;
  } catch {
    return Response.error();
  }
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
      .then(async (cache) => {
        await cache.addAll(CORE);
        /* 하나가 실패해도 설치는 계속(앱 셸이 우선) */
        await Promise.all(OFFLINE_CORE.map((url) => cache.add(url).catch(() => undefined)));
      })
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
  if (url.pathname.startsWith("/pdfjs/")) event.respondWith(cacheFirst(request));
  else if (isAppCode(request)) event.respondWith(networkFirst(request));
});

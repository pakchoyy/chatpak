// Halaman: network-first dengan cadangan offline.
// File statis: cache maksimal 7 hari. /api dan gambar hasil tidak pernah masuk cache.
const CACHE = "static-v2";
const PAGES = "pages-v1";
const MAX_AGE = 7 * 24 * 3600 * 1000;
const STATIC = (p) => p.startsWith("/_next/static/") || p.startsWith("/icons/") || p === "/manifest.json";

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(PAGES).then((c) => c.add("/")).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) =>
  e.waitUntil(
    caches
      .keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE && k !== PAGES).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  ),
);

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/api/")) return;

  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res.ok && url.pathname === "/") {
            const copy = res.clone(); // harus sebelum body dibaca browser
            caches.open(PAGES).then((c) => c.put("/", copy));
          }
          return res;
        })
        .catch(() => caches.match("/", { cacheName: PAGES }).then((r) => r || Response.error())),
    );
    return;
  }

  if (!STATIC(url.pathname)) return;
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(e.request);
      const at = hit && Number(hit.headers.get("x-cached-at"));
      if (hit && Date.now() - at < MAX_AGE) return hit;
      try {
        const res = await fetch(e.request);
        if (res.ok) {
          const h = new Headers(res.headers);
          h.set("x-cached-at", String(Date.now()));
          cache.put(e.request, new Response(await res.clone().blob(), { status: res.status, headers: h }));
        }
        return res;
      } catch (err) {
        if (hit) return hit;
        throw err;
      }
    }),
  );
});

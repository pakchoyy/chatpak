// Cache hanya file statis, maksimal 7 hari. /api dan gambar hasil tidak pernah masuk cache.
const CACHE = "static-v1";
const MAX_AGE = 7 * 24 * 3600 * 1000;
const STATIC = (p) => p.startsWith("/_next/static/") || p.startsWith("/icons/");

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) =>
  e.waitUntil(
    caches
      .keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  ),
);

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin || !STATIC(url.pathname)) return;
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

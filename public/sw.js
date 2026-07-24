// Minimal service worker: caches the app shell so a repeat visit (or a
// flaky connection) still gets *something* rather than a blank screen.
// Deliberately does NOT intercept API/Supabase requests — those need to
// hit the network for real data, caching them would show stale
// products/prices/stock, which is worse than a loading spinner.
const CACHE_NAME = "urbankicks-shell-v1";
const SHELL_ASSETS = ["/", "/manifest.json", "/favicon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Never cache API calls, Supabase requests, or non-GET requests.
  if (event.request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/functions/")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

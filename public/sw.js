const CACHE_NAME = "vocabee-pwa-v2";
const PRECACHE_URLS = [
  "/",
  "/offline",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Fetch and cache one by one so a single failure doesn't block the whole SW installation
      for (const url of PRECACHE_URLS) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            await cache.put(url, response);
          }
        } catch (e) {
          console.error("Failed to precache:", url, e);
        }
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Skip API requests and Supabase
  if (url.pathname.startsWith("/api/") || url.host.includes("supabase")) {
    return;
  }

  // Handle HTML navigation requests
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request.url, copy));
          return response;
        })
        .catch(async () => {
          // ignoreVary is critical for Next.js because it sets Vary: RSC headers
          // ignoreSearch handles start_url like /?source=pwa
          let cached = await caches.match(event.request.url, {
            ignoreSearch: true,
            ignoreVary: true,
          });

          if (!cached) {
            cached = await caches.match("/", { ignoreSearch: true, ignoreVary: true });
          }

          if (!cached) {
            cached = await caches.match("/offline", { ignoreSearch: true, ignoreVary: true });
          }

          if (cached) return cached;
          
          return new Response("Offline", {
            status: 200,
            headers: new Headers({ "Content-Type": "text/html" }),
          });
        })
    );
    return;
  }

  // Handle other same-origin requests (assets, images, etc.)
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request, { ignoreSearch: true, ignoreVary: true }).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          // Do not cache opaque responses or non-200 responses
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response;
          }
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        }).catch((err) => {
          console.error("Asset fetch failed", err);
        });
      })
    );
  }
});

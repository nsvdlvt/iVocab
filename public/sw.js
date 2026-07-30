const CACHE_NAME = "vocabee-pwa-v3";
const APP_SHELL_URLS = ["/offline", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png"];
const IGNORED_CACHE_HEADERS = ["rsc", "next-router-state-tree", "next-url"];

function hasAppRouterHeaders(request) {
  return IGNORED_CACHE_HEADERS.some((header) => request.headers.has(header));
}

function isDocumentNavigation(request) {
  return request.mode === "navigate" && request.destination === "document";
}

function isHtmlResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("text/html");
}

async function cacheResponse(cacheKey, response) {
  if (!response || !response.ok) return;
  if (!isHtmlResponse(response)) return;

  const cache = await caches.open(CACHE_NAME);
  await cache.put(cacheKey, response.clone());
}

async function getOfflineFallback() {
  const cache = await caches.open(CACHE_NAME);

  const offline = await cache.match("/offline", {
    ignoreSearch: true,
    ignoreVary: false,
  });
  if (offline) return offline;

  const shell = await cache.match("/", {
    ignoreSearch: true,
    ignoreVary: false,
  });
  if (shell && isHtmlResponse(shell)) return shell;

  return new Response("Offline", {
    status: 200,
    headers: new Headers({ "Content-Type": "text/html; charset=utf-8" }),
  });
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const url of APP_SHELL_URLS) {
        try {
          const response = await fetch(url, { cache: "no-store" });
          if (response.ok) {
            await cache.put(url, response);
          }
        } catch (error) {
          console.error("Failed to precache:", url, error);
        }
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.host.includes("supabase")) return;
  if (hasAppRouterHeaders(event.request)) return;

  if (isDocumentNavigation(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          if (!response) {
            return getOfflineFallback();
          }

          if (response.status === 404) {
            return response;
          }

          if (response.ok && isHtmlResponse(response)) {
            await cacheResponse(event.request.url, response);
            return response;
          }

          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const cachedDocument = await cache.match(event.request.url, {
            ignoreSearch: true,
            ignoreVary: false,
          });

          if (cachedDocument && isHtmlResponse(cachedDocument)) {
            return cachedDocument;
          }

          return getOfflineFallback();
        })
    );
    return;
  }

  if (event.request.destination === "document") return;

  event.respondWith(
    caches.match(event.request, { ignoreSearch: false, ignoreVary: false }).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (!response || !response.ok || response.type !== "basic") {
            return response;
          }

          const isCacheableAsset =
            event.request.destination !== "document" &&
            event.request.destination !== "serviceworker";

          if (!isCacheableAsset) return response;

          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch((error) => {
          console.error("Asset fetch failed", error);
        });
    })
  );
});

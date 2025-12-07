// Version control - update this when you want to force cache refresh
const SW_VERSION = "1.0.0";
const CACHE_NAME = `blue-code-v${SW_VERSION}`;
const RUNTIME_CACHE = `blue-code-runtime-v${SW_VERSION}`;

// Assets to cache on install
const PRECACHE_ASSETS = [
  "/",
  "/static/css/main.css",
  "/static/js/main.js",
  "/manifest.json",
];

// Install event - cache assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[Service Worker] Caching assets");
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
            })
            .map((cacheName) => {
              console.log("[Service Worker] Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached version if available
      if (cachedResponse) {
        return cachedResponse;
      }

      // Otherwise fetch from network
      return fetch(event.request)
        .then((response) => {
          // Don't cache if not a valid response
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache the fetched response
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // Network failed, return offline fallback if available
          if (event.request.destination === "document") {
            return caches.match("/");
          }
        });
    })
  );
});

// Handle push notifications (for future use)
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Blue Code";
  const options = {
    body: data.body || "You have a new notification",
    icon: "/img/icons/icon-192x192.png", // Will be available when icons are created
    badge: "/img/icons/icon-72x72.png",
    vibrate: [200, 100, 200],
    data: data,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(clients.openWindow(event.notification.data?.url || "/"));
});

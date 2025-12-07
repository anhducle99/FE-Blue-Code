export function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      const swUrl = `${process.env.PUBLIC_URL || ""}/sw.js`;

      if (process.env.NODE_ENV === "development") {
        fetch(swUrl)
          .then((response) => {
            if (
              response.status === 404 ||
              !response.headers.get("content-type")?.includes("javascript")
            ) {
              console.log("[Service Worker] No service worker found");
              return;
            }
            registerValidSW(swUrl);
          })
          .catch(() => {
            console.log(
              "[Service Worker] No internet connection. App is running in offline mode."
            );
          });
      } else {
        registerValidSW(swUrl);
      }
    });
  }
}

function registerValidSW(swUrl: string) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log(
        "[Service Worker] Registered successfully:",
        registration.scope
      );

      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }

        installingWorker.onstatechange = () => {
          if (installingWorker.state === "installed") {
            if (navigator.serviceWorker.controller) {
              console.log(
                "[Service Worker] New content available; please refresh."
              );
            } else {
              console.log("[Service Worker] Content cached for offline use.");
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error("[Service Worker] Registration failed:", error);
    });
}

export function unregisterServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}

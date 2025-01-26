import { clientsClaim } from "workbox-core";
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst } from "workbox-strategies";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { ExpirationPlugin } from "workbox-expiration";
import listener from "./worker-server";

declare let self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();

self.skipWaiting();

clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);

// Cache images with CacheFirst strategy
registerRoute(
  ({ request }) => request.destination === "image",
  new CacheFirst({
    cacheName: "images-cache",
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 1000, // Maximum number of images to cache
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        purgeOnQuotaError: true, // Automatically cleanup if storage quota is exceeded
      }),
    ],
  })
);

self.addEventListener("fetch", async (event) => {
  const url = new URL(event.request.url);
  if (url.origin === self.origin && url.pathname.startsWith("/opfs-")) {
    event.respondWith(handleOpfsRequest(url.pathname));
  }

  const res = listener(event);
  if (res) event.respondWith(res);
});

async function handleOpfsRequest(pathname: string) {
  const dirHandle = await navigator.storage.getDirectory();
  const fileHandle = await dirHandle.getFileHandle(pathname.replace("/", ""));
  const file = await fileHandle.getFile();
  return new Response(file);
}

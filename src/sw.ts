import { clientsClaim } from "workbox-core";
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import listener from "./worker-server";

declare let self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();

self.skipWaiting();

clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("fetch", async (event) => {
  const url = new URL(event.request.url);
  
  // Bypass service worker for LiveStore endpoint requests
  // LiveStore uses /_livestore for syncing - let browser handle it directly
  if (url.origin === self.origin && url.pathname.startsWith("/_livestore")) {
    return; // No service worker intervention
  }
  
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

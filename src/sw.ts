import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'

declare let self: ServiceWorkerGlobalScope

cleanupOutdatedCaches()

self.skipWaiting()

clientsClaim()

precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('fetch', async (event) => {
  const url = new URL(event.request.url);
  if (url.origin === self.origin && url.pathname.startsWith('/opfs-')) {
    event.respondWith(handleOpfsRequest(url.pathname));
  }
});

async function handleOpfsRequest(pathname: string) {
  const dirHandle = await navigator.storage.getDirectory();
  const fileHandle = await dirHandle.getFileHandle(pathname.replace('/', ''));
  const file = await fileHandle.getFile();
  return new Response(file);
}

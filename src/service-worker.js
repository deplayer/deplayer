// Loading precache
workbox.precaching.precacheAndRoute(self.__precacheManifest);

workbox.routing.registerRoute(
  /\.(?:png|gif|jpg|jpeg|svg)$/,
  new workbox.strategies.CacheFirst({
    cacheName: 'images',
    plugins: [
      new workbox.expiration.Plugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
);

/* workbox.routing.registerRoute(
  // Custom `matchCallback` function
  ({event}) => event.request.destination === 'audio',
  new workbox.strategies.CacheFirst({
    cacheName: 'audio',
    plugins: [
      new workbox.expiration.Plugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
) */

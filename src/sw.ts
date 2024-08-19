import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'

declare let self: ServiceWorkerGlobalScope

cleanupOutdatedCaches()

self.skipWaiting()

clientsClaim()

precacheAndRoute(self.__WB_MANIFEST)


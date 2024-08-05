import { clientsClaim } from 'workbox-core'
import { precacheAndRoute } from 'workbox-precaching'
import WebTorrent from 'webtorrent'

declare let self: ServiceWorkerGlobalScope

clientsClaim()

precacheAndRoute(self.__WB_MANIFEST)

const client = new WebTorrent()

async function checkState() {
  const registration = await navigator.serviceWorker.getRegistration()
  return registration?.active && client.createServer({ controller: registration })
}

addEventListener('statechange', checkState)

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import fixReactVirtualized from 'esbuild-plugin-react-virtualized'
import { fileURLToPath } from 'url'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), nodePolyfills(), VitePWA({
    strategies: 'injectManifest',
    registerType: 'autoUpdate',
    injectRegister: 'auto',
    srcDir: 'src',
    filename: 'sw.ts',
    includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
    devOptions: {
      enabled: true,
      type: 'module'
    },
    manifest: {
      name: 'deplayer',
      short_name: 'deplayer',
      description: 'Decentralized mediaplayer which runs entirely in the browser',
      theme_color: '#0e1b1e',
      icons: [
        {
          src: "pwa-64x64.png",
          sizes: "64x64",
          type: "image/png"
        },
        {
          src: "pwa-192x192.png",
          sizes: "192x192",
          type: "image/png"
        },
        {
          src: "pwa-512x512.png",
          sizes: "512x512",
          type: "image/png"
        },
        {
          src: "maskable-icon-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable"
        }
      ]
    }
  })],
  optimizeDeps: {
    esbuildOptions: {
      plugins: [fixReactVirtualized]
    },
  },
  resolve: {
    alias: {
      'webtorrent': fileURLToPath(new URL('./node_modules/webtorrent/dist/webtorrent.min.js', import.meta.url)),
    },
  },
})

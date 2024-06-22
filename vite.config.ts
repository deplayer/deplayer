import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import fixReactVirtualized from 'esbuild-plugin-react-virtualized'
import { fileURLToPath } from 'url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), nodePolyfills()],
  optimizeDeps: {
    esbuildOptions: {
      plugins: [fixReactVirtualized],
    },
  },
  resolve: {
    alias: {
      'webtorrent': fileURLToPath(new URL('./node_modules/webtorrent/dist/webtorrent.min.js', import.meta.url)),
    },
  },
})

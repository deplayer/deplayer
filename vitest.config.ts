import { defineConfig } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'


export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto'
    })
  ],
  test: {
    coverage: {
      provider: 'v8'
    },
    setupFiles: ['vitest-setup.ts'],
    environment: 'happy-dom'
  },
});

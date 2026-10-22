/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  /**
   * Base URL of the Cloudflare LiveStore sync worker (see
   * `docs/livestore-sync.md`), e.g.
   * `https://deplayer-sync.<account>.workers.dev`. Unset = sync disabled.
   */
  readonly VITE_LIVESTORE_SYNC_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

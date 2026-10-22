import type { SyncBackendRpcInterface } from '@livestore/sync-cf/cf-worker'
import type { AuthDO } from './AuthDO'

/**
 * Worker environment bindings.
 *
 * - SYNC_BACKEND_DO / AUTH_DO: Durable Objects (see wrangler.toml)
 * - JWT_SECRET: HS256 signing key for sync session tokens (secret, ≥32 bytes)
 * - RP_ID / RP_NAME: WebAuthn relying party identity
 * - ALLOWED_ORIGINS: comma-separated list of allowed browser origins
 */
export interface Env {
  SYNC_BACKEND_DO: DurableObjectNamespace<SyncBackendRpcInterface>
  AUTH_DO: DurableObjectNamespace<AuthDO>
  JWT_SECRET: string
  RP_ID: string
  RP_NAME: string
  ALLOWED_ORIGINS: string
}

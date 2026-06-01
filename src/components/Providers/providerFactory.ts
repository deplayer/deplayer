/**
 * Lightweight provider factory used by `useProviderHealth`.
 *
 * Returns an object exposing `healthcheck()` for the four provider types that
 * implement it (subsonic, jellyfin, mstream). itunes / musicbrainz return
 * `undefined` — the hook surfaces `'unknown'` for them.
 *
 * Kept separate from `src/providers/index.ts` so the health-check path does
 * not pay the full constructor cost (e.g. Jellyfin SDK initialization) for
 * providers we only need to probe.
 */
import SubsonicApiProvider from '../../providers/SubsonicApiProvider'
import JellyfinProvider from '../../providers/JellyfinProvider'
import MstreamApiProvider from '../../providers/MstreamApiProvider'
import type { HealthCheckResult } from '../../types/providers'

type WithHealthcheck = { healthcheck?: () => Promise<HealthCheckResult> }

const getBase = (key: string) => key.replace(/[0-9]+$/, '')

export const providerFactory = (
  instanceKey: string,
  config: Record<string, unknown>,
): WithHealthcheck | undefined => {
  const base = getBase(instanceKey)
  try {
    switch (base) {
      case 'subsonic':
        return new SubsonicApiProvider(config as { baseUrl: string; user: string; password: string }, instanceKey)
      case 'jellyfin':
        return new JellyfinProvider(
          config as { baseUrl: string; apiKey: string; username: string; password: string },
          instanceKey,
        )
      case 'mstream':
        return new MstreamApiProvider(config as { baseUrl: string }, instanceKey)
      default:
        return undefined
    }
  } catch {
    return undefined
  }
}

export default providerFactory

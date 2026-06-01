// Resolves an IMusicProvider for a given instance key + config, used by
// useProviderHealth. itunes / musicbrainz have no remote config to probe and
// return undefined here so the hook surfaces 'unknown'.
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

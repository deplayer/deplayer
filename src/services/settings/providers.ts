import type { ProviderSchema } from '../../types/providers'

const providerRegistry: Record<string, ProviderSchema> = {
  subsonic: {
    key: 'subsonic',
    label: 'labels.subsonic',
    repeatable: true,
    fields: [
      { key: 'enabled', type: 'boolean', label: 'labels.enabled' },
      { key: 'baseUrl', type: 'url', label: 'labels.baseUrl', required: true },
      { key: 'user', type: 'text', label: 'labels.user', required: true },
      { key: 'password', type: 'password', label: 'labels.password', required: true },
    ],
    capabilities: ['sync', 'search', 'stream'],
  },
  mstream: {
    key: 'mstream',
    label: 'labels.mstream',
    repeatable: true,
    fields: [
      { key: 'enabled', type: 'boolean', label: 'labels.enabled' },
      { key: 'baseUrl', type: 'url', label: 'labels.baseUrl', required: true },
    ],
    capabilities: ['search', 'stream'],
  },
  itunes: {
    key: 'itunes',
    label: 'labels.itunes',
    repeatable: false,
    fields: [
      { key: 'enabled', type: 'boolean', label: 'labels.enabled' },
    ],
    capabilities: ['search'],
  },
  jellyfin: {
    key: 'jellyfin',
    label: 'labels.jellyfin',
    repeatable: true,
    fields: [
      { key: 'enabled', type: 'boolean', label: 'labels.enabled' },
      { key: 'baseUrl', type: 'url', label: 'labels.jellyfin.baseUrl', required: true },
      { key: 'apiKey', type: 'text', label: 'labels.jellyfin.apiKey', required: true },
      { key: 'username', type: 'text', label: 'labels.jellyfin.username', required: true },
      { key: 'password', type: 'password', label: 'labels.password', required: true },
    ],
    capabilities: ['search', 'stream'],
  },
  musicbrainz: {
    key: 'musicbrainz',
    label: 'labels.musicbrainz',
    repeatable: false,
    fields: [
      { key: 'enabled', type: 'boolean', label: 'labels.enabled' },
    ],
    capabilities: ['search'],
  },
}

export { providerRegistry }
export default providerRegistry

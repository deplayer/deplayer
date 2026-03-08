import type { SectionSchema } from '../../types/providers'

const sectionRegistry: Record<string, SectionSchema> = {
  lastfm: {
    key: 'lastfm',
    label: 'labels.lastfm',
    fields: [
      { key: 'enabled', type: 'boolean', label: 'labels.enabled' },
      { key: 'apikey', type: 'text', label: 'labels.lastfm.apikey' },
    ],
  },
  'youtube-dl-server': {
    key: 'youtube-dl-server',
    label: 'labels.youtube-dl-server',
    fields: [
      { key: 'host', type: 'text', label: 'labels.youtube-dl-server.host', default: 'http://localhost' },
    ],
  },
}

export { sectionRegistry }
export default sectionRegistry

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
}

export { sectionRegistry }
export default sectionRegistry

import { ISettingsProvider } from './ISettingsProvider'

export default class Musicbrainz implements ISettingsProvider {
  isRepeatable: false

  constructor() {
    this.isRepeatable = false
  }

  getFormSchema() {
    return {
      fields: [
        { title: "labels.musicbrainz", type: 'title' },
        { title: "labels.enabled", name: 'providers.musicbrainz.enabled', type: 'checkbox' },
      ]
    }
  }
} 
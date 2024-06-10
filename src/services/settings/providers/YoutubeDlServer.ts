import { ISettingsProvider } from './ISettingsProvider'

export default class YoutubeDlServer implements ISettingsProvider {
  isRepeatable: true

  constructor() {
    this.isRepeatable = true
  }

  getFormSchema(index: string = '') {
    return {
      fields:
        [
          { title: "labels.youtube-dl-server", type: 'title' },
          { title: "labels.enabled", name: `providers.youtube-dl-server${index}.enabled`, type: 'checkbox' },
          { title: "labels.url", name: `providers.youtube-dl-server${index}.url`, type: 'url' }
        ]
    }
  }
}

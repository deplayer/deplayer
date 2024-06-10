import { ISettingsProvider } from './ISettingsProvider'

export default class Mstream implements ISettingsProvider {
  isRepeatable: true

  constructor() {
    this.isRepeatable = true
  }

  getFormSchema() {
    return {
      fields: [
        { title: "labels.mstream", type: 'title' },
        { title: "labels.enabled", name: 'providers.mstream.enabled', type: 'checkbox' },
        { title: "labels.mstream.baseUrl", name: 'providers.mstream.baseUrl', type: 'url' },
      ]
    }
  }
}

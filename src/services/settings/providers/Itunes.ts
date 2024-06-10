import { ISettingsProvider } from './ISettingsProvider'

export default class Itunes implements ISettingsProvider {
  isRepeatable: false

  constructor() {
    this.isRepeatable = false
  }

  getFormSchema() {
    return {
      fields: [
        { title: "labels.itunes", type: 'title' },
        { title: "labels.enabled", name: 'providers.itunes.enabled', type: 'checkbox' },
      ]
    }
  }
}

import { ISettingsProvider } from './ISettingsProvider'

export default class Subsonic implements ISettingsProvider {
  isRepeatable: true

  constructor() {
    this.isRepeatable = true
  }

  getFormSchema(index: string = '') {
    return {
      fields:
        [
          { title: "labels.subsonic", type: 'title' },
          { title: "labels.enabled", name: `providers.subsonic${index}.enabled`, type: 'checkbox' },
          { title: "labels.subsonic.baseUrl", name: `providers.subsonic${index}.baseUrl`, type: 'url' },
          { title: "labels.subsonic.user", name: `providers.subsonic${index}.user`, type: 'text' },
          { title: "labels.subsonic.password", name: `providers.subsonic${index}.password`, type: 'password' }
        ]
    }
  }
}

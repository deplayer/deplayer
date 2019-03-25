import { ISettingsSection } from './ISettingsSection'

export default class Subsonic implements ISettingsSection {
  getFormSchema() {
    return [
      {title: "labels.subsonic", type: 'title'},
      {title: "labels.enabled", name: 'providers.subsonic.enabled', type: 'checkbox'},
      {title: "labels.subsonic.baseUrl", name: 'providers.subsonic.baseUrl', type: 'url'},
      {title: "labels.subsonic.user", name: 'providers.subsonic.user', type: 'text'},
      {title: "labels.subsonic.password", name: 'providers.subsonic.password', type: 'password'},
    ]
  }
}

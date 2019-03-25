import { ISettingsBuilder } from '../../interfaces/ISettingsBuilder'

export default class SettingsBuilder implements ISettingsBuilder {
  getFormSchema() {
    return (
      {
        fields: [
          {title: "labels.mstream", type: 'title'},
          {title: "labels.enabled", name: 'providers.mstream.enabled', type: 'checkbox'},
          {title: "labels.mstream.baseUrl", name: 'providers.mstream.baseUrl', type: 'url'},
          {title: "labels.subsonic", type: 'title'},
          {title: "labels.enabled", name: 'providers.subsonic.enabled', type: 'checkbox'},
          {title: "labels.subsonic.baseUrl", name: 'providers.subsonic.baseUrl', type: 'url'},
          {title: "labels.subsonic.user", name: 'providers.subsonic.user', type: 'text'},
          {title: "labels.subsonic.password", name: 'providers.subsonic.password', type: 'password'},
          {title: "labels.itunes", type: 'title'},
          {title: "labels.enabled", name: 'providers.itunes.enabled', type: 'checkbox'},
        ]
      }
    )
  }
}

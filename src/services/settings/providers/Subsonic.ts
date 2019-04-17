import { ISettingsSection } from './ISettingsSection'

export default class Subsonic implements ISettingsSection {
  isRepeatable: true

  getFormSchema(index: string = '') {
    return [
      {title: "labels.subsonic", type: 'title'},
      {title: "labels.enabled", name: `providers.subsonic${ index }.enabled`, type: 'checkbox'},
      {title: "labels.subsonic.baseUrl", name: `providers.subsonic${ index }.baseUrl`, type: 'url'},
      {title: "labels.subsonic.user", name: `providers.subsonic${ index }.user`, type: 'text'},
      {title: "labels.subsonic.password", name: `providers.subsonic${ index }.password`, type: 'password'}
    ]
  }
}

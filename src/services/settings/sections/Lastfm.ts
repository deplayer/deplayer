import { ISettingsSection } from './ISettingsSection'

export default class Lastfm implements ISettingsSection {
  isRepeatable: false

  getFormSchema(index: string = '') {
    return [
      {title: "labels.lastfm", type: 'title'},
      {title: "labels.enabled", name: `metadataProviders.lastfm.enabled`, type: 'checkbox'},
      {title: "labels.lastfm.apikey", name: `metadataProviders.lastfm.apikey`, type: 'text'},
    ]
  }
}

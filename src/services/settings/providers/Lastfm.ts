import { ISettingsProvider } from './ISettingsProvider'

export default class Lastfm implements ISettingsProvider {
  isRepeatable: true

  getFormSchema(index: string = '') {
    return {
      fields:
      [
        {title: "labels.lastfm", type: 'title'},
        {title: "labels.enabled", name: `providers.lastfm.enabled`, type: 'checkbox'},
        {title: "labels.lastfm.apikey", name: `providers.lastfm.apikey`, type: 'text'},
      ]
    }
  }
}

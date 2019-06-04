import { ISettingsProvider } from './ISettingsProvider'

export default class Lastfm implements ISettingsProvider {
  isRepeatable: true

  getFormSchema(index: string = '') {
    return {
      fields:
      [
        {title: "labels.lastfm", type: 'title'},
        {title: "labels.enabled", name: `providers.lastfm.enabled`, type: 'checkbox'},
        {title: "labels.lastfm.baseUrl", name: `providers.lastfm.baseUrl`, type: 'url'},
        {title: "labels.lastfm.user", name: `providers.lastfm.user`, type: 'text'},
        {title: "labels.lastfm.password", name: `providers.lastfm.password`, type: 'password'}
      ]
    }
  }
}

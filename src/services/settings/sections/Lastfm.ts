import { ISettingsSection } from './ISettingsSection'

export default class Lastfm implements ISettingsSection {
  isRepeatable: false

  constructor() {
    this.isRepeatable = false
  }

  getFormSchema(_index: string = '') {
    return [
      { title: "labels.lastfm", type: 'title' },
      { title: "labels.enabled", name: `app.lastfm.enabled`, type: 'checkbox' },
      { title: "labels.lastfm.apikey", name: `app.lastfm.apikey`, type: 'text' },
    ]
  }
}

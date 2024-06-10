import { ISettingsSection } from './ISettingsSection'

export default class DatabaseSync implements ISettingsSection {
  isRepeatable: false

  constructor() {
    this.isRepeatable = false
  }

  getFormSchema(_index: string = '') {
    return [
      { title: "labels.databaseSync", type: 'title' },
      { title: "labels.enabled", name: `app.databaseSync.enabled`, type: 'checkbox' },
      { title: "labels.databaseSync.remote", name: `app.databaseSync.remote`, type: 'text' },
    ]
  }
}

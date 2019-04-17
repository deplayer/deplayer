import { ISettingsSection } from './ISettingsSection'

export default class Itunes implements ISettingsSection {
  isRepeatable: false

  getFormSchema() {
    return [
      {title: "labels.itunes", type: 'title'},
      {title: "labels.enabled", name: 'providers.itunes.enabled', type: 'checkbox'},
    ]
  }
}

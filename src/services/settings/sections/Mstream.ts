import { ISettingsSection } from './ISettingsSection'

export default class Mstream implements ISettingsSection {
  getFormSchema() {
    return [
      {title: "labels.mstream", type: 'title'},
      {title: "labels.enabled", name: 'providers.mstream.enabled', type: 'checkbox'},
      {title: "labels.mstream.baseUrl", name: 'providers.mstream.baseUrl', type: 'url'},
    ]
  }
}

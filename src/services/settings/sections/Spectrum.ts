import { ISettingsSection } from './ISettingsSection'

export default class Spectrum implements ISettingsSection {
  isRepeatable: false

  getFormSchema() {
    return [
      {title: "labels.spectrum", type: 'title'},
      {title: "labels.enabled", name: 'app.spectrum.enabled', type: 'checkbox'}
    ]
  }
}

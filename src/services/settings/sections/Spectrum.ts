import { ISettingsSection } from './ISettingsSection'

export default class Spectrum implements ISettingsSection {
  isRepeatable: false

  constructor() {
    this.isRepeatable = false
  }

  getFormSchema() {
    return [
      { title: "labels.player", type: 'title' },
      { title: "labels.enableSpectrum", name: 'app.spectrum.enabled', type: 'checkbox' },
    ]
  }
}

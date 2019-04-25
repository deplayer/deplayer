import { ISettingsSection } from './ISettingsSection'

export default class Spectrum implements ISettingsSection {
  isRepeatable: false

  getFormSchema() {
    return [
      {title: "labels.enableSpectrum", name: 'app.spectrum.enabled', type: 'checkbox'}
    ]
  }
}

import { ISettingsSection } from './ISettingsSection'

export default class Spectrum implements ISettingsSection {
  isRepeatable: false

  getFormSchema() {
    return [
      {title: "labels.player", type: 'title'},
      {title: "labels.enableSpectrum", name: 'app.spectrum.enabled', type: 'checkbox'},
      {title: "labels.enableReactPlayer", name: 'app.reactPlayer.enabled', type: 'checkbox'}
    ]
  }
}

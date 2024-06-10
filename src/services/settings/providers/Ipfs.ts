import { ISettingsProvider } from './ISettingsProvider'

export default class Ipfs implements ISettingsProvider {
  isRepeatable: true

  constructor() {
    this.isRepeatable = true
  }

  getFormSchema(index: string = '') {
    return {
      fields:
        [
          { title: "labels.ipfs", type: 'title' },
          { title: "labels.enabled", name: `providers.ipfs${index}.enabled`, type: 'checkbox' },
          { title: "labels.ipfs.hash", name: `providers.ipfs${index}.hash`, type: 'string' }
        ]
    }
  }
}

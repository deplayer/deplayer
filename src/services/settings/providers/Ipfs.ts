import { ISettingsProvider } from './ISettingsProvider'

export default class Ipfs implements ISettingsProvider {
  isRepeatable: true

  getFormSchema(index: string = '') {
    return {
      fields:
      [
        {title: "labels.ipfs", type: 'title'},
        {title: "labels.enabled", name: `providers.ipfs${ index }.enabled`, type: 'checkbox'},
        {title: "labels.ipfs.host", name: `providers.ipfs${ index }.host`, type: 'string', default: 'localhost'},
        // TODO: Implement default
        {title: "labels.ipfs.port", name: `providers.ipfs${ index }.port`, type: 'number', default: 5001},
        {title: "labels.ipfs.hash", name: `providers.ipfs${ index }.hash`, type: 'string'}
      ]
    }
  }
}

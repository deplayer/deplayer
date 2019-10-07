import { ISettingsSection } from './ISettingsSection'

export default class IpfsSettings implements ISettingsSection {
  isRepeatable: false

  getFormSchema() {
    return [
      {title: "labels.ipfs", type: 'title'},
      {title: "labels.ipfs.host", name: `app.ipfs.host`, type: 'text', default: 'ipfs.io'},
      {title: "labels.ipfs.port", name: `app.ipfs.port`, type: 'number', default: '80'},
      {title: "labels.ipfs.proto", name: `app.ipfs.proto`, type: 'text', default: 'https'},
    ]
  }
}

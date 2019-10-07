import { ISettingsSection } from './ISettingsSection'

export default class IpfsSettings implements ISettingsSection {
  isRepeatable: false

  getFormSchema() {
    return [
      {title: "labels.ipfs", type: 'title'},
      {title: "labels.ipfs.gateway", name: `app.ipfs.gateway`, type: 'text'},
    ]
  }
}

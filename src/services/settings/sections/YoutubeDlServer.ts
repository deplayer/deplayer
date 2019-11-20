import { ISettingsSection } from './ISettingsSection'

export default class IpfsSettings implements ISettingsSection {
  isRepeatable: false

  getFormSchema() {
    return [
      {title: "labels.youtube-dl-server", type: 'title'},
      {title: "labels.youtube-dl-server.host", name: `app.youtube-dl-server.host.host`, type: 'text', default: 'http://localhost'},
    ]
  }
}

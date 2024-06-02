import { IMusicProvider } from './IMusicProvider'

export default class DummyProvider implements IMusicProvider {
  providerKey: string
  enabled: boolean

  constructor(settings: any, providerKey: string) {
    this.providerKey = providerKey
    this.enabled = settings.enabled
  }

  search(searchTerm: string): Promise<any> {
    return new Promise((resolve) => {
      resolve([
        { title: 'Highway to hell' }
      ])
    })
  }
}

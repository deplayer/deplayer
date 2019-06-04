
import { IProvider } from './IProvider'

export default class LastfmProvider implements IProvider {
  providerKey: string
  enabled: boolean

  constructor(settings: any, providerKey: string) {
    this.providerKey = providerKey
    this.enabled = settings.enabled
  }

  search(searchTerm: string): Promise<any> {
    return new Promise((resolve) => {
      resolve([
        {title: 'Highway to hell'}
      ])
    })
  }
}

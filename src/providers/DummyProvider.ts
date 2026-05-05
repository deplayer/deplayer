import { IMusicProvider } from './IMusicProvider'
import { NormalizedMedia } from '../utils/normalizeMedia'

export default class DummyProvider implements IMusicProvider {
  providerKey: string
  enabled: boolean

  constructor(settings: { enabled: boolean }, providerKey: string) {
    this.providerKey = providerKey
    this.enabled = settings.enabled
  }

  search(_searchTerm: string): Promise<NormalizedMedia[]> {
    return new Promise((resolve) => {
      resolve([] as NormalizedMedia[])
    })
  }
}

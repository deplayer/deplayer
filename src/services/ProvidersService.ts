import { NormalizedMedia } from '../utils/normalizeMedia'
import { createProvider } from '../providers/registry'
import type { ProviderInstance } from '../providers/registry'
import type { SettingsShape } from './settings/shape'

export default class ProvidersService {
  providers: Record<string, ProviderInstance> = {}

  constructor(config: SettingsShape) {
    for (const [instanceKey, parameters] of Object.entries(config.providers)) {
      if (!parameters.enabled) continue
      const provider = createProvider(instanceKey, parameters)
      if (provider) this.providers[instanceKey] = provider
    }
  }

  search = (searchTerm: string): Array<Promise<NormalizedMedia[]>> => {
    return Object.keys(this.providers).map((provider) => {
      return this.searchForProvider(searchTerm, provider)
    })
  }

  searchForProvider = (searchTerm: string, provider: string): Promise<NormalizedMedia[]> => {
    if (!this.providers[provider]) {
      throw Error(`Provider ${provider} not found`)
    }

    return this.providers[provider].search(searchTerm)
  }
}

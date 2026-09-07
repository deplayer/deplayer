
import providersIndex from '../providers'
import { NormalizedMedia } from '../utils/normalizeMedia'
import type { IMusicProvider } from '../providers/IMusicProvider'
import type { ProviderSettings, SettingsShape } from './settings/shape'

export interface ProviderInstance extends Partial<IMusicProvider> {
  search(searchTerm: string): Promise<NormalizedMedia[]>;
  providerKey?: string;
}


export default class ProvidersService {
  providers: Record<string, ProviderInstance> = {}

  constructor(config: SettingsShape) {
    Object.keys(config.providers).forEach((provider) => {

      const providerType = provider.replace(/[0-9]/g, '')

      if (providersIndex[providerType as keyof typeof providersIndex]) {
        const parameters = config.providers[provider]

        if (parameters.enabled) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          this.providers[provider] = new (providersIndex[providerType as keyof typeof providersIndex] as new (params: ProviderSettings, type: string) => ProviderInstance)(parameters, providerType)
        }
      }
    })
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

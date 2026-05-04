import { ISearchService } from './ISearchService'
import providersIndex from '../providers'
import { NormalizedMedia } from '../utils/normalizeMedia'

export default class ProvidersService implements ISearchService {
  providers: { [key: string]: any} = {}

  constructor(config: any) {
    Object.keys(config.providers).forEach((provider) => {

      const providerType = provider.replace(/[0-9]/g, '')

      if (providersIndex[providerType as keyof typeof providersIndex]) {
        const parameters = config.providers[provider]

        if (parameters.enabled) {
          this.providers[provider] = new providersIndex[providerType as keyof typeof providersIndex](parameters, providerType)
        }
      }
    })
  }

  search = (searchTerm: string): Array<Promise<any>> => {
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

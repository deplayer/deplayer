// @flow

import { IProvider } from '../providers/IProvider'
import { ISearchService } from './ISearchService'
import { ISettings } from '../interfaces/ISettings'
import providers from '../providers'

export default class ProvidersService  implements ISearchService {
  providers: Array<IProvider> = []

  constructor(config: ISettings) {
    Object.keys(config.providers).forEach((provider) => {
      if (providers[provider]) {
        const parameters = config.providers[provider]

        if (parameters.enabled) {
          this.providers.push(new providers[provider](parameters))
        }
      }
    })
  }

  search = (searchTerm: string): Array<Promise<any>> => {
    return this.providers.map((provider) => {
      return provider.search(searchTerm)
    })
  }
}

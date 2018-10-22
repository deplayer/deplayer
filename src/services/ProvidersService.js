// @flow

import { IRepository } from '../repositories/IRepository'
import { ISearchService } from './ISearchService'
import { IConfig } from '../interfaces/IConfig'
import providers from '../providers'

export default class ProvidersService  implements ISearchService {
  providers: Array<IRepository> = []

  constructor(config: IConfig) {
    Object.keys(config.providers).forEach((provider) => {
      if (providers[provider]) {
        const parameters = config.providers[provider]
        this.providers.push(new providers[provider](parameters))
      }
    })
  }

  search(searchTerm: string): Promise<any> {
    return new Promise((resolve) => {
      resolve({})
    })
  }
}

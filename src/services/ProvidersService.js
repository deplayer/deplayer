// @flow

import { IRepository } from '../repositories/IRepository'
import { ISearchService } from './ISearchService'
import { ISettings } from '../interfaces/ISettings'
import providers from '../providers'

export default class ProvidersService  implements ISearchService {
  providers: Array<IRepository> = []

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

  search = (searchTerm: string): Promise<Array<any>> => {

    return new Promise((resolve, reject) => {
      const promises = this.providers.map((provider) => {
        return provider.search(searchTerm)
      })

      Promise.all(promises).then((results) => {
        const oneLevelResults = []

        results.forEach((provResults) => {
          provResults.forEach((mediaItem) => {
            oneLevelResults.push(mediaItem)
          })
        })

        resolve(oneLevelResults)
      })
      .catch(reject)
    })
  }
}

// @flow

import { IRepository } from './IRepository'

/**
 * It should implement the API documented here: https://github.com/IrosTheBeggar/mStream/blob/master/docs/API/db_search.md
 */
export default class MstreamApiRepository implements IRepository {
  search(searchTerm: string): Promise<Array<any>> {
    return new Promise((resolve, reject) => {
      resolve([])
    })
  }
}

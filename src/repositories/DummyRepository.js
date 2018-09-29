// @flow

import { IRepository } from './IRepository'

export default class DummyRepository implements IRepository {

  search(searchTerm: string): Promise<any> {
    return new Promise((resolve) => {
      resolve([
        {title: 'Highway to hell'}
      ])
    })
  }
}

// @flow

import IRepository from './IRepository'

export default class DummyRepository implements IRepository {

  search(searchTerm: string) {
    return [
      {title: 'Highway to hell'}
    ]
  }
}

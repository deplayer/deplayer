// @flow

import { IProvider } from './IProvider'

export default class DummyProvider implements IProvider {

  search(searchTerm: string): Promise<any> {
    return new Promise((resolve) => {
      resolve([
        {title: 'Highway to hell'}
      ])
    })
  }
}

// @flow

import { IAdapter } from './IAdapter'

export default class RxdbAdapter implements IAdapter {
  save(model: string, id: string, payload: any): Promise<any> {
    return new Promise((resolve) => {
      resolve()
    })
  }
}

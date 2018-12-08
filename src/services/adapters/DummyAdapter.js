// @flow

import { IAdapter } from './IAdapter'

export default class DummyAdapter implements IAdapter {
  initialize() {
  }

  save(model: string, id: string, payload: any): Promise<any> {
    return new Promise((resolve) => {
      resolve({})
    })
  }

  addMany(model: string, payload: any): Promise<any> {
    return new Promise((resolve) => {
      resolve({})
    })
  }

  removeMany(model: string, payload: any): Promise<any> {
    return new Promise((resolve) => {
      resolve({})
    })
  }

  removeCollection(model: string): Promise<any> {
    return new Promise((resolve) => {
      resolve({})
    })
  }

  get(model: string, id: string): Promise<any> {
    return new Promise((resolve) => {
      resolve({})
    })
  }

  getAll(model: string): Promise<any> {
    return new Promise((resolve) => {
      resolve([])
    })
  }
}

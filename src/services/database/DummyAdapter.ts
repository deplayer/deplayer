import { IAdapter } from './IAdapter'

export default class DummyAdapter implements IAdapter {
  async initialize() {
  }

  save(_model: string, _id: string, _payload: any): Promise<any> {
    return new Promise((resolve) => {
      resolve({})
    })
  }

  addMany(_model: string, _payload: any): Promise<any> {
    return new Promise((resolve) => {
      resolve({})
    })
  }

  removeMany(_model: string, _payload: any): Promise<any> {
    return new Promise((resolve) => {
      resolve({})
    })
  }

  removeCollection(_model: string): Promise<any> {
    return new Promise((resolve) => {
      resolve({})
    })
  }

  exportCollection(_model: string): Promise<any> {
    return new Promise((resolve) => {
      resolve({})
    })
  }

  importCollection(_model: string, _data: any): Promise<any> {
    return new Promise((resolve) => {
      resolve({})
    })
  }

  get(_model: string, _id: string): Promise<any> {
    return new Promise((resolve) => {
      resolve({})
    })
  }

  getAll(_model: string): Promise<any> {
    return new Promise((resolve) => {
      resolve([])
    })
  }

  getDb() {
    return new Promise((resolve) => {
      resolve([])
    })
  }
}

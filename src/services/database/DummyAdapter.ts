import { IAdapter } from './IAdapter'

export default class DummyAdapter implements IAdapter {
  async initialize() {
    // Dummy inintialize
  }

  save(_model: string, _id: string, _payload: any): Promise<any> {
    return Promise.resolve({})
  }

  addMany(_model: string, _payload: any): Promise<any> {
    return Promise.resolve({})
  }

  removeMany(_model: string, _payload: any): Promise<any> {
    return Promise.resolve({})
  }

  removeCollection(_model: string): Promise<any> {
    return Promise.resolve({})
  }

  exportCollection(_model: string): Promise<any> {
    return Promise.resolve({})
  }

  importCollection(_model: string, _data: any): Promise<any> {
    return Promise.resolve({})
  }

  get(_model: string, _id: string): Promise<any> {
    return Promise.resolve({})
  }

  getAll(_model: string): Promise<any> {
    return Promise.resolve({})
  }

  getDb() {
    return Promise.resolve({})
  }
}

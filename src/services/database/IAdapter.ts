export type Models = 'media' | 'playlist' | 'settings' | 'queue' | 'appcache' | 'search_index'

export interface IAdapter {
  initialize(model: Models): Promise<void>,
  save(model: Models, id: string, payload: any): Promise<any>,
  addMany(model: Models, payload: Array<any>): Promise<any>,
  removeMany(model: Models, payload: Array<any>): Promise<any>,
  get(model: Models, id: string): Promise<any>,
  getAll(model: Models, conditions: any): Promise<any>,
  removeCollection(model: Models): Promise<any>,
  exportCollection(model: Models): Promise<any>,
  importCollection(model: Models, data: any): Promise<any>,
  getDb(): Promise<any>
}

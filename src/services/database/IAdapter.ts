export interface IAdapter {
  initialize(model: string): void,
  save(model: string, id: string, payload: any): Promise<any>,
  addMany(model: string, payload: Array<any>): Promise<any>,
  removeMany(model: string, payload: Array<any>): Promise<any>,
  get(model: string, id: string): Promise<any>,
  getAll(model: string, conditions: any): Promise<any>,
  removeCollection(model: string): Promise<any>,
  exportCollection(model: string): Promise<any>,
  importCollection(model: string, data: any): Promise<any>,
  getDb(): Promise<any>
}

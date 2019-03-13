export interface IAdapter {
  initialize(model: string): void,
  save(model: string, id: string, payload: any): Promise<any>,
  addMany(model: string, payload: Array<any>): Promise<any>,
  removeMany(model: string, payload: Array<any>): Promise<any>,
  get(model: string, id: string): Promise<any>,
  getAll(model: string): Promise<any>,
  removeCollection(model: string): Promise<any>
}

// @flow

export interface IAdapter {
  initialize(model: string): void,
  save(model: string, id: string, payload: any): Promise<any>,
  get(model: string, id: string): Promise<any>
}

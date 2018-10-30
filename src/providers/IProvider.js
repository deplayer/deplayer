// @flow

export interface IProvider {
  search(searchTerm: string): Promise<Array<any>>
}

// @flow

export interface IRepository {
  search(searchTerm: string): Promise<any>
}

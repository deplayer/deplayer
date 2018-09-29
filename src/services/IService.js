// @flow

export interface IService {
  search(searchTerm: string): Promise<any>
}

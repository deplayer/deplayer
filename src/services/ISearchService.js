// @flow

export interface ISearchService {
  search(searchTerm: string): Promise<any>
}

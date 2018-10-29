// @flow

export interface ISearchService {
  search(searchTerm: string): Array<Promise<any>>
}

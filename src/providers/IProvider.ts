export interface IProvider {
  providerKey: string,
  search(searchTerm: string): Promise<Array<any>>
}

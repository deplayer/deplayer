export interface IMusicProvider {
  providerKey: string,
  search(searchTerm: string): Promise<Array<any>>
}

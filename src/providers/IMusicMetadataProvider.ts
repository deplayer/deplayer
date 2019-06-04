export interface IMusicMetadataProvider {
  providerKey: string,
  searchArtistInfo(searchTerm: string): Promise<Array<any>>
}

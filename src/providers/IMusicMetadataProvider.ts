export interface ArtistInfo {
  'life-span'?: { begin?: string; end?: string; ended?: boolean }
  country?: string
  relations?: Array<{ type: string; url: { resource: string } }>
  artist?: { bio?: { content: string } }
  similarartists?: { artist?: Array<{ name: string }> }
}

export interface IMusicMetadataProvider {
  providerKey: string,
  searchArtistInfo(searchTerm: string): Promise<ArtistInfo | null | undefined>
}


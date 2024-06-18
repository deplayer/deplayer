
import { IMusicMetadataProvider } from './IMusicMetadataProvider'
import { MusicBrainzApi } from 'musicbrainz-api'

const mbApi = new MusicBrainzApi({
  appName: 'decentraplayer',
  appVersion: '0.1.0',
  appContactInfo: 'user@mail.org' // Or URL to application home page
});

export default class MusicbrainzProvider implements IMusicMetadataProvider {
  providerKey: string

  constructor(_settings: any, providerKey: string) {
    this.providerKey = providerKey
  }

  async searchArtistInfo(searchTerm: string): Promise<any> {
    const artistResults = await mbApi.searchArtist(searchTerm)
    if (artistResults.artists[0]) {
      const id = artistResults.artists[0].id
      return mbApi.getArtist(id, ['recordings', 'releases', 'release-groups', 'works', 'url-rels'])
    }

    return Promise.resolve()
  }
}

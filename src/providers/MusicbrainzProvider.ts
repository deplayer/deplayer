import { IMusicMetadataProvider } from './IMusicMetadataProvider'
import axios from 'axios'

export default class MusicbrainzProvider implements IMusicMetadataProvider {
  baseUrl: string = 'https://musicbrainz.org/ws/2'
  providerKey: string

  constructor(_settings: any, providerKey: string) {
    this.providerKey = providerKey
  }

  async searchArtistInfo(searchTerm: string): Promise<any> {
    try {
      // First search for the artist
      const searchResponse = await axios.get(`${this.baseUrl}/artist?query=${encodeURIComponent(searchTerm)}&fmt=json`, {
        headers: {
          'User-Agent': 'deplayer/1.0.0 ( https://github.com/deplayer/deplayer )'
        }
      });

      if (searchResponse.data.artists && searchResponse.data.artists[0]) {
        const artistId = searchResponse.data.artists[0].id;
        
        // Then get the full artist details including relationships
        const artistResponse = await axios.get(
          `${this.baseUrl}/artist/${artistId}?inc=url-rels+artist-rels+aliases&fmt=json`,
          {
            headers: {
              'User-Agent': 'deplayer/1.0.0 ( https://github.com/deplayer/deplayer )'
            }
          }
        );

        // Transform the response to match the expected format
        const artist = artistResponse.data;
        return {
          'life-span': artist['life-span'],
          country: artist.country,
          relations: artist.relations.filter((rel: any) => rel.url).map((rel: any) => ({
            type: rel.type,
            url: { resource: rel.url.resource }
          })),
          artist: {
            bio: {
              content: artist.disambiguation || artist.aliases?.map((a: any) => a.name).join(', ') || ''
            }
          }
        };
      }
    } catch (error) {
      console.error('MusicBrainz API error:', error);
    }

    return Promise.resolve();
  }
}

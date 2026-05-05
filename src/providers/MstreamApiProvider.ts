import axios from 'axios'

import { normalizeMedia, NormalizedMedia } from '../utils/normalizeMedia'
import { IMusicProvider } from './IMusicProvider'

type MstreamSong = {
  filepath: string
  metadata: {
    artist: string
    album: string
    title: string
    'album-art'?: string
  }
}

/**
 * It should implement the API documented here: https://github.com/IrosTheBeggar/mStream/blob/master/docs/API/db_search.md
 */
export default class MstreamApiProvider implements IMusicProvider {
  baseUrl: string
  albumSongsUrl: string
  providerKey: string

  constructor(settings: { baseUrl: string }, providerKey: string) {
    this.albumSongsUrl = settings.baseUrl + '/db/album-songs'
    this.baseUrl = settings.baseUrl
    this.providerKey = providerKey
  }

  matchSearch = (song: MstreamSong, searchTerm: string) => {
    const re = new RegExp(searchTerm.toLowerCase(), 'gi')
    return re.test(song.filepath)
      || re.test(song.metadata.artist)
      || re.test(song.metadata.album)
      || re.test(song.metadata.title)
  }

  filterSongs = (result: Array<MstreamSong>, searchTerm: string): Array<MstreamSong> => {
    return result.filter((resultSong) => {
      return this.matchSearch(resultSong, searchTerm)
    })
  }

  mapSongs = (songs: Array<MstreamSong>): NormalizedMedia[] => {
    return songs.map((song: MstreamSong) => {
      const songTitle = song.metadata.title ? song.metadata.title : song.filepath

      return normalizeMedia({
        title: songTitle,
        artistName: song.metadata.artist,
        albumName: song.metadata.album,
        type: 'audio',
        genres: [],
        cover: {
          thumbnailUrl: song.metadata['album-art'] ? this.baseUrl + '/album-art/' + song.metadata['album-art'] : '',
          fullUrl: song.metadata['album-art'] ? this.baseUrl + '/album-art/' + song.metadata['album-art'] : ''
        },
        stream: {
          mstreamer: {
            service: this.providerKey,
            uris: [{ uri: this.baseUrl + '/media/' + decodeURIComponent(song.filepath) }]
          }
        }
      })
    })
  }

  search(searchTerm: string): Promise<NormalizedMedia[]> {
    return new Promise((resolve, reject) => {
      axios.post(this.albumSongsUrl)
        .then((result) => {
          const mappedSongs = this.filterSongs(result.data, searchTerm)
          resolve(this.mapSongs(mappedSongs))
        })
        .catch((err) => {
          reject(err)
        })
    })
  }

  async getArtistSongs(artistName: string): Promise<NormalizedMedia[]> {
    // Mstream doesn't have artist-specific endpoint, use search as fallback
    return this.search(artistName)
  }
}

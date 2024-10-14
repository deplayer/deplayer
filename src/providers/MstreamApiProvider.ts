import axios from 'axios'

import Media from '../entities/Media'
import { IMusicProvider } from './IMusicProvider'

/**
 * It should implement the API documented here: https://github.com/IrosTheBeggar/mStream/blob/master/docs/API/db_search.md
 */
export default class MstreamApiProvider implements IMusicProvider {
  baseUrl: string
  albumSongsUrl: string
  providerKey: string

  constructor(settings: any, providerKey: string) {
    this.albumSongsUrl = settings.baseUrl + '/db/album-songs'
    this.baseUrl = settings.baseUrl
    this.providerKey = providerKey
  }

  matchSearch = (song: any, searchTerm: string) => {
    const re = new RegExp(searchTerm.toLowerCase(), 'gi')
    return re.test(song.filepath)
      || re.test(song.metadata.artist)
      || re.test(song.metadata.album)
      || re.test(song.metadata.title)
  }

  filterSongs = (result: Array<any>, searchTerm: string): Array<any> => {
    return result.filter((resultSong) => {
      return this.matchSearch(resultSong, searchTerm)
    })
  }

  mapSongs = (songs: Array<any>): Array<Media> => {
    return songs.map((song: any) => {
      const songTitle = song.metadata.title ? song.metadata.title : song.filepath

      return new Media({
        title: songTitle,
        artistName: song.metadata.artist,
        albumName: song.metadata.album,
        album: {
          name: song.metadata.album,
          artist: { name: song.metadata.artist }
        },
        artist: {
          name: song.metadata.artist
        },
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

  search(searchTerm: string): Promise<Array<any>> {
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
}

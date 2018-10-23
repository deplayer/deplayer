// @flow

import axios from 'axios'

import Song from '../entities/Song'
import { IRepository } from './IRepository'

/**
 * It should implement the API documented here: https://github.com/IrosTheBeggar/mStream/blob/master/docs/API/db_search.md
 */
export default class MstreamApiRepository implements IRepository {
  baseUrl: string
  albumSongsUrl: string

  constructor(settings: any) {
    this.albumSongsUrl = settings.baseUrl + '/db/album-songs'
    this.baseUrl = settings.baseUrl
  }

  matchSearch = (song: any, searchTerm: string) => {
    const re = new RegExp(searchTerm, 'gi')
    return re.test(song.filepath)
      || re.test(song.metadata.artist)
      || re.test(song.metadata.album)
      || re.test(song.metadata.title)
  }

  filterSongs = (result: any, searchTerm: string): Array<any> => {
    return result.filter((resultSong) => {
      return this.matchSearch(resultSong, searchTerm)
    })
  }

  mapSongs = (songs: Array<any>): Array<any> => {
    return songs.map((song: any) => {
      return new Song({
        id: song.metadata.hash,
        title: song.metadata.title,
        artistName: song.metadata.artist,
        albumName: song.metadata.album,
        thumbnailUrl: song.metadata['album-art'],
        fullUrl: song.metadata['album-art'],
        stream: [
          {
            service: 'mstream',
            uris: [{uri: this.baseUrl + '/media/' + decodeURIComponent(song.filepath)}]
          }
        ]
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

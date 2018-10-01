// @flow

import axios from 'axios'

import { IRepository } from './IRepository'
import Song from '../entities/Song'

export default class ItunesApiRepository implements IRepository {
  baseUrl = 'https://itunes.apple.com'

  populateUrl(searchTerm: string): string {
    return `${this.baseUrl}/search?term=${encodeURIComponent(searchTerm)}`
  }

  mapResponse(result: any): Array<Song> {
    return result.data.results.map((itSong) => {
      return this.songFromItSong(itSong)
    })
  }

  // Map itunes song to entity song params
  songFromItSong(itSong: any) {
    return new Song({
      artistName: itSong.artistName,
      title: itSong.trackName,
      albumName: itSong.collectionName,
      thumbnailUrl: itSong.artworkUrl60,
      fullUrl: itSong.artworkUrl100.replace(/100x100/, '600x600'),
      duration: itSong.trackTimeMillis,
      genre: itSong.primaryGenreName,
      price: itSong.trackPrice,
      currency: itSong.currency,
      stream: [
        {service: 'itunes', uris: [{uri: itSong.previewUrl, quality: 'demo'}]}
      ]
    })
  }

  // Execute search request against itunes API
  search(searchTerm: string): Promise<any> {
    return new Promise((resolve, reject) => {
      axios.get(this.populateUrl(searchTerm))
        .then((result) => {
          resolve(this.mapResponse(result))
        })
        .catch((err) => {
          reject(err)
        })
    })
  }
}

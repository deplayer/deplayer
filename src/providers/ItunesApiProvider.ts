import axios from 'axios'

import { IMusicProvider } from './IMusicProvider'
import Media from '../entities/Media'

export default class ItunesApiProvider implements IMusicProvider {
  baseUrl: string
  providerKey: string

  constructor(_settings: any, providerKey = 'itunes') {
    this.baseUrl = 'https://itunes.apple.com'
    this.providerKey = providerKey
  }

  populateUrl(searchTerm: string): string {
    return `${this.baseUrl}/search?term=${encodeURIComponent(searchTerm)}`
  }

  mapResponse(result: any): Array<Media> {
    return result.data.results.map((itSong: Media) => {
      return this.songFromItSong(itSong)
    })
  }

  // Map itunes song to entity song params
  songFromItSong(itSong: any) {
    const isAudio = itSong.kind === 'song'

    return new Media({
      artistName: itSong.artistName,
      title: itSong.trackName,
      albumName: itSong.collectionName,
      cover: {
        thumbnailUrl: itSong.artworkUrl60.replace(/60x60/, '250x250'),
        fullUrl: itSong.artworkUrl100.replace(/100x100/, '600x600'),
      },
      duration: itSong.trackTimeMillis,
      genre: itSong.primaryGenreName,
      shareUrl: itSong.trackViewUrl,
      type: isAudio ? 'audio' : 'video',
      stream: [
        { service: this.providerKey, uris: [{ uri: itSong.previewUrl }] }
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

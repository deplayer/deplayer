
import { IMusicMetadataProvider } from './IMusicMetadataProvider'
import axios from 'axios'

export default class LastfmProvider implements IMusicMetadataProvider {
  baseUrl: string = 'https://ws.audioscrobbler.com/2.0/'
  apikey: string
  providerKey: string
  enabled: boolean
  artistInfoUrl: string

  constructor(settings: any, providerKey: string) {
    this.providerKey = providerKey
    this.enabled = settings.enabled
    this.apikey = settings.apikey
    this.artistInfoUrl = `${this.baseUrl}?method=artist.getinfo&api_key=${this.apikey}&format=json`
  }

  searchArtistInfo(searchTerm: string): Promise<any> {
    if (!this.enabled) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      axios.get(`${this.artistInfoUrl}&artist=${searchTerm}`)
        .then((result) => {
          console.log('lastfm result', result)
          resolve(result.data)
        })
        .catch((err) => {
          reject(err)
        })
    })
  }
}


import { IProvider } from './IProvider'
import axios from 'axios'

export default class LastfmProvider implements IProvider {
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

  search(searchTerm: string): Promise<any> {
    return new Promise((resolve, reject) => {
      axios.get(`${this.artistInfoUrl}&artist=${searchTerm}`)
        .then((result) => {
          console.log('lastfm result', result)
          resolve()
        })
        .catch((err) => {
          reject(err)
        })
    })
  }
}

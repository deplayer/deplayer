
import axios from 'axios'

export default class LyricsovhProvider {
  searchLyrics(song: any): Promise<any> {
    const baseUrl = 'https://api.lyrics.ovh/v1'
    return axios.get(`${baseUrl}/${song.artist.name}/${song.title}`)
  }
}

import axios from 'axios'

export default class LyricsovhProvider {
  async searchLyrics(song: any): Promise<any> {
    const baseUrl = 'https://api.lyrics.ovh/v1'
    const artist = encodeURIComponent(song.artist.name)
    const title = encodeURIComponent(song.title)

    try {
      const response = await axios.get(`${baseUrl}/${artist}/${title}`)
      
      // Validate response format
      if (!response.data || !response.data.lyrics) {
        throw new Error('Invalid lyrics response format')
      }

      return response.data
    } catch (error: any) {
      // Handle specific error cases
      if (error.response) {
        if (error.response.status === 404) {
          throw new Error('Lyrics not found')
        }
        throw new Error(`API error: ${error.response.status}`)
      }
      throw error
    }
  }
}

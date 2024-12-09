import { IStorageService } from './IStorageService'
import { IAdapter } from './database/IAdapter'

class LyricsService implements IStorageService {
  constructor(private adapter: IAdapter) {
    this.adapter = adapter
  }

  async save(songId: string, lyrics: string) {
    await this.adapter.save('media_lyrics', songId, { id: songId, mediaId: songId, lyrics })
  }

  async get(songId: string) {   
    return await this.adapter.get('media_lyrics', songId)
  }
}

export default LyricsService

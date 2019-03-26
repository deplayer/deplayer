import Song from './Song'
import SongId from './SongId'

describe('entities/SongId', () => {
  it('should calculate value property', () => {
    const song = new Song()
    const songId = new SongId(song)

    expect(songId.value).toBeDefined()
  })

  it('should create the id from song name, artist and album', () => {
    const song = new Song({albumName: 'lorem', artistName: 'ipsum', title: 'amet'})
    const songId = new SongId(song)

    expect(songId.value).toBe('ipsum-lorem-amet')
  })

  it('should avoid spaces', () => {
    const song = new Song({albumName: 'lorem with', artistName: 'ipsum space', title: 'amet configured'})
    const songId = new SongId(song)

    expect(songId.value).toBe('ipsum-space-lorem-with-amet-configured')
  })
})

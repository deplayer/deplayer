import Media from './Media'
import MediaId from './MediaId'

describe('entities/SongId', () => {
  it('should calculate value property', () => {
    const song = new Media()
    const songId = new MediaId(song)

    expect(songId.value).toBeDefined()
  })

  it('should create the id from song name, artist and album', () => {
    const song = new Media({albumName: 'lorem', artistName: 'ipsum', title: 'amet'})
    const songId = new MediaId(song)

    expect(songId.value).toBe('ipsum-lorem-amet')
  })

  it('should avoid spaces', () => {
    const song = new Media({albumName: 'lorem with', artistName: 'ipsum space', title: 'amet configured'})
    const songId = new MediaId(song)

    expect(songId.value).toBe('ipsum-space-lorem-with-amet-configured')
  })
})

import { describe, it, expect } from 'vitest'

import Media from './Media'
import MediaId from './MediaId'
import { mediaParams } from './Media.spec'

describe('entities/SongId', () => {
  const song = new Media(mediaParams)
  it('should calculate value property', () => {
    const songId = new MediaId(song)

    expect(songId.value).toBeDefined()
  })

  it('should create the id from song name, artist and album', () => {
    const song = new Media({ ...mediaParams, albumName: 'lorem', artistName: 'ipsum', title: 'amet' })
    const songId = new MediaId(song)

    expect(songId.value).toBe('ipsum-lorem-amet')
  })

  it('should avoid spaces', () => {
    const song = new Media({ ...mediaParams, albumName: 'lorem with', artistName: 'ipsum space', title: 'amet configured' })
    const songId = new MediaId(song)

    expect(songId.value).toBe('ipsum-space-lorem-with-amet-configured')
  })
})

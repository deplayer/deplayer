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
    const song = new Media({ ...mediaParams, albumName: 'lorem', artistName: 'ipsum', title: 'amet', track: 1 })
    const songId = new MediaId(song)

    expect(songId.value).toBe('ipsum-lorem-0001-amet')
  })

  it('should avoid spaces', () => {
    const song = new Media({ ...mediaParams, albumName: 'lorem with', artistName: 'ipsum space', title: 'amet configured', track: 1 })
    const songId = new MediaId(song)

    expect(songId.value).toBe('ipsum-space-lorem-with-0001-amet-configured')
  })
})

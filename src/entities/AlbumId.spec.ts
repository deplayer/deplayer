import { describe, it, expect } from 'vitest'

import AlbumId from './AlbumId'

describe('entities/AlbumId', () => {
  it('should calculate value property', () => {
    const albumId = new AlbumId({ albumName: '', artistName: '' })

    expect(albumId.value).toBeDefined()
  })

  it('should create the id from album name', () => {
    const albumId = new AlbumId({ albumName: 'lorem', artistName: 'ipsum' })

    expect(albumId.value).toBe('ipsum-lorem')
  })
})

import { describe, it, expect } from 'vitest'

import Media from './Media'

describe('entities/Media', () => {
  it('should have id property', () => {
    const song = new Media()
    expect(song.id).toBeDefined()
  })

  it('should create a Media with stream information', () => {
    const song = new Media({ stream: [{ uris: [{ uri: 'http://some-songs-api/song.mp4' }], service: 'itunes' }] })
    expect(song.stream[0].service).toEqual('itunes')
    expect(song.stream[0].uris[0].uri).toEqual('http://some-songs-api/song.mp4')
  })

  it('should create s Media with thumbnail and full size covers', () => {
    const song = new Media({ cover: { thumbnailUrl: 'http://some-songs-api/song.mp4' } })
    expect(song.cover.thumbnailUrl).toEqual('http://some-songs-api/song.mp4')
  })

  it('should create s Media with shareUrl', () => {
    const song = new Media({ shareUrl: 'http://some-songs-api/song.mp4' })
    expect(song.shareUrl).toEqual('http://some-songs-api/song.mp4')
  })

  it('should answer hasAnyProviderOf', () => {
    const song = new Media({
      stream: [{ uris: [{ uri: 'http://some-songs-api/song.mp4' }], service: 'itunes' }]
    })

    expect(song.hasAnyProviderOf(['itunes'])).toEqual(true)
  })

  it('should create proper song id from artist-album-title', () => {
    const song = new Media({
      artistName: 'artist',
      albumName: 'album',
      title: 'title'
    })

    expect(song.id).toEqual('artist-album-title')
  })
})

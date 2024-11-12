import { describe, it, expect } from 'vitest'

import Media, { IMedia } from './Media'

export const mediaParams: IMedia = {
  id: '1',
  title: 'title',
  type: 'audio',
  artist: { name: 'artist' },
  artistName: 'artistName',
  artistId: '1',
  albumName: 'albumName',
  album: { id: 'album', name: 'album', artist: { name: 'foo' } },
  genres: ['genre'],
  duration: 100,
  cover: { thumbnailUrl: 'thumbnail', fullUrl: '' },
  stream: {},
  playCount: 1,
  shareUrl: 'shareUrl',
  filePath: 'filePath',
  forcedId: null
}

describe('entities/Media', () => {
  it('should have id property', () => {
    const song = new Media(mediaParams)
    expect(song.id).toBeDefined()
  })

  it('should create a Media with stream information', () => {
    const song = new Media({ ...mediaParams, stream: { itunes: { uris: [{ uri: 'http://some-songs-api/song.mp4' }], service: 'itunes' } } })
    expect(song.stream.itunes.service).toEqual('itunes')
    expect(song.stream.itunes.uris[0].uri).toEqual('http://some-songs-api/song.mp4')
  })

  it('should create s Media with thumbnail and full size covers', () => {
    const song = new Media({
      ...mediaParams,
      cover: { thumbnailUrl: 'http://some-songs-api/song.mp4', fullUrl: '' }
    })
    expect(song?.cover?.thumbnailUrl).toEqual('http://some-songs-api/song.mp4')
  })

  it('should create s Media with shareUrl', () => {
    const song = new Media({ ...mediaParams, shareUrl: 'http://some-songs-api/song.mp4' })
    expect(song.shareUrl).toEqual('http://some-songs-api/song.mp4')
  })

  it('should answer hasAnyProviderOf', () => {
    const song = new Media({
      ...mediaParams,
      stream: { itunes: { uris: [{ uri: 'http://some-songs-api/song.mp4' }], service: 'itunes' } }
    })

    expect(song.hasAnyProviderOf(['itunes'])).toEqual(true)
  })

  it('should create proper song id from artist-album-title', () => {
    const song = new Media({
      ...mediaParams,
      forcedId: null,
      artistName: 'artist',
      albumName: 'album',
      title: 'title',
      track: 23
    })

    expect(song.id).toEqual('artist-album-0023-title')
  })
})

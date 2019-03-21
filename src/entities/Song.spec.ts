// @flow

import Song from './Song'

describe('entities/Song', () => {
  it('should have id property', () => {
    const song = new Song()
    expect(song.id).toBeDefined()
  })

  it('should create a Song with stream information', () => {
    const song = new Song({stream: [{uris: [{uri: 'http://some-songs-api/song.mp4'}], service: 'itunes'}]})
    expect(song.stream[0].service).toEqual('itunes')
    expect(song.stream[0].uris[0].uri).toEqual('http://some-songs-api/song.mp4')
  })

  it('should create s Song with thumbnail and full size covers', () => {
    const song = new Song({thumbnailUrl: 'http://some-songs-api/song.mp4'})
    expect(song.cover.thumbnailUrl).toEqual('http://some-songs-api/song.mp4')
  })

  it('should create s Song with shareUrl', () => {
    const song = new Song({shareUrl: 'http://some-songs-api/song.mp4'})
    expect(song.shareUrl).toEqual('http://some-songs-api/song.mp4')
  })

  it('should answer hasAnyProviderOf', () => {
    const song = new Song({
      stream: [{uris: [{uri: 'http://some-songs-api/song.mp4'}], service: 'itunes'}]
    })

    expect(song.hasAnyProviderOf(['itunes'])).toEqual(true)
  })
})

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

  it('should create s Song with thumbnail and full size covers')
})

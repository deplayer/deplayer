import reducer, { defaultState } from './collection'
import * as types from '../constants/ActionTypes'
import Song from '../entities/Song'

describe('collection reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, {}))
      .toEqual(defaultState)
  })

  it('should handle RECEIVE_COLLECTION', () => {
    const initialState = {...defaultState, enabledProviders: ['itunes']}
    const fixtureSong = new Song({
      artistName: 'The Doors',
      albumName: 'LIght my fire',
      stream: [{uris: [{uri: 'http://some-songs-api/song.mp4'}], service: 'itunes'}]
    })
    const rows = {}
    rows[fixtureSong.id] = new Song(fixtureSong)

    const artists = {}
    artists[fixtureSong.artist.id] = fixtureSong.artist

    const songsByArtist = {}
    songsByArtist[fixtureSong.artist.id] = [fixtureSong.id]

    const albumsByArtist = {}
    albumsByArtist[fixtureSong.artist.id] = [fixtureSong.album.id]

    const songsByAlbum = {}
    songsByAlbum[fixtureSong.album.id] = [fixtureSong.id]

    const expected = {
      ...initialState,
      totalRows: 1,
      artists,
      songsByArtist,
      albumsByArtist,
      songsByAlbum,
      rows,
      visibleSongs: [fixtureSong.id]
    }

    expect(reducer(initialState, {type: types.RECEIVE_COLLECTION, data: [fixtureSong]}))
      .toEqual(expected)
  })

  it('should handle RECEIVE_SETTINGS to filter by provider', () => {
    const expected = {...defaultState, enabledProviders: ['mstream']}
    const action = {
      type: types.RECEIVE_SETTINGS,
      settings: {
        providers: {
          itunes: {
            enabled: false
          },
          mstream: {
            enabled: true
          }
        }
      }
    }
    expect(reducer(defaultState, action))
      .toEqual(expected)
  })
})

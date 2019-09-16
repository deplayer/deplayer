import reducer, { defaultState } from './collection'
import * as types from '../constants/ActionTypes'
import Song from '../entities/Song'

import SongId from '../entities/SongId'
import ArtistId from '../entities/ArtistId'
jest.mock('../entities/SongId');
jest.mock('../entities/ArtistId');

describe('collection reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, {}))
      .toEqual(defaultState)
  })

  it('should handle RECEIVE_COLLECTION', () => {
    const initialState = {...defaultState, enabledProviders: ['itunes']}
    const fixtureSong = new Song({
      forcedId: 'the-doors',
      artistName: 'The Doors',
      artistId: 'the-doors',
      albumName: 'LIght my fire',
      stream: [{uris: [{uri: 'http://some-songs-api/song.mp4'}], service: 'itunes'}]
    })
    const rows = {}
    rows[fixtureSong.id] = fixtureSong

    const artists = {}
    artists[fixtureSong.artist.id] = fixtureSong.artist

    const songsByArtist = {}
    songsByArtist[fixtureSong.artist.id] = [fixtureSong.id]

    const albumsByArtist = {}
    albumsByArtist[fixtureSong.artist.id] = [fixtureSong.album.id]

    const songsByAlbum = {}
    songsByAlbum[fixtureSong.album.id] = [fixtureSong.id]

    const albums = {}
    albums[fixtureSong.album.id] = fixtureSong.album

    const expected = {
      ...initialState,
      totalRows: 1,
      artists,
      songsByArtist,
      albumsByArtist,
      songsByAlbum,
      albums,
      rows,
      loading: false,
      visibleSongs: [fixtureSong.id]
    }

    // slugify has a huge performance penalization, so should be avoided when RECEIVE_COLLECTION
    expect(SongId).not.toHaveBeenCalled()
    expect(ArtistId).not.toHaveBeenCalled()

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

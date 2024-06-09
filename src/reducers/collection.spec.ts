import { describe, expect, it } from 'vitest'
import * as types from '../constants/ActionTypes'
import Media from '../entities/Media'
import reducer, { defaultState } from './collection'

describe('collection reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, {}))
      .toEqual(defaultState)
  })

  it.only('should handle RECEIVE_COLLECTION', () => {
    const initialState = { ...defaultState, enabledProviders: ['itunes'] }
    const fixtureSong = new Media({
      forcedId: 'the-doors',
      artistName: 'The Doors',
      artistId: 'the-doors',
      albumName: 'LIght my fire',
      stream: [{ uris: [{ uri: 'http://some-songs-api/song.mp4' }], service: 'itunes' }]
    })
    const rows = { [fixtureSong.id]: fixtureSong.toDocument() }
    const artists = { [fixtureSong.artist.id]: fixtureSong.artist.toDocument() }
    const songsByArtist = { [fixtureSong.artist.id]: [fixtureSong.id] }
    const albumsByArtist = { [fixtureSong.artist.id]: [fixtureSong.album.id] }
    const songsByAlbum = { [fixtureSong.album.id]: [fixtureSong.id] }
    const albums = { [fixtureSong.album.id]: fixtureSong.album.toDocument() }

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
      mediaByType: { audio: ['the-doors'] },
      visibleSongs: [fixtureSong.id]
    }

    expect(reducer(initialState, { type: types.RECEIVE_COLLECTION, data: [fixtureSong] }))
      .toEqual(expected)
  })

  it('should handle RECEIVE_SETTINGS to filter by provider', () => {
    const expected = { ...defaultState, enabledProviders: ['mstream'] }
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

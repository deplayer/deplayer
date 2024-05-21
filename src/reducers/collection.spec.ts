import reducer, { defaultState } from './collection'
import { describe, it, expect } from 'vitest'
import * as types from '../constants/ActionTypes'
import Media from '../entities/Media'

import MediaId from '../entities/MediaId'
import ArtistId from '../entities/ArtistId'
jest.mock('../entities/MediaId');
jest.mock('../entities/ArtistId');

describe('collection reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, {}))
      .toEqual(defaultState)
  })

  xit('should handle RECEIVE_COLLECTION', () => {
    const initialState = { ...defaultState, enabledProviders: ['itunes'] }
    const fixtureSong = new Media({
      forcedId: 'the-doors',
      artistName: 'The Doors',
      artistId: 'the-doors',
      albumName: 'LIght my fire',
      stream: [{ uris: [{ uri: 'http://some-songs-api/song.mp4' }], service: 'itunes' }]
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
      mediaByType: { audio: ['the-doors'] },
      visibleSongs: [fixtureSong.id]
    }

    // slugify has a huge performance penalization, so should be avoided when RECEIVE_COLLECTION
    expect(MediaId).not.toHaveBeenCalled()
    expect(ArtistId).not.toHaveBeenCalled()

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

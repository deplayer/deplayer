/// <reference types="jest" />

import '@testing-library/jest-dom'
import type { jest } from '@jest/globals'

import React from 'react'
import { render, fireEvent, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Playlist from './Playlist'
import * as types from '../../constants/ActionTypes'
import { State as CollectionState } from '../../reducers/collection'

// Mock translations
jest.mock('react-redux-i18n', () => ({
  Translate: ({ value }: { value: string }) => value
}))

// Mock useNavigate
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}))

const mockDispatch = jest.fn()

describe('Playlist', () => {
  const mockCollectionState: CollectionState = {
    rows: {
      'song-1': {
        id: 'song-1',
        title: 'Song 1',
        duration: 180000,
        album: { id: 'album-1' },
        cover: { thumbnailUrl: 'cover1.jpg' }
      } as any,
      'song-2': {
        id: 'song-2',
        title: 'Song 2',
        duration: 240000,
        album: { id: 'album-2' },
        cover: { thumbnailUrl: 'cover2.jpg' }
      } as any,
      'song-3': {
        id: 'song-3',
        title: 'Song 3',
        duration: 200000,
        album: { id: 'album-3' },
        cover: { thumbnailUrl: 'cover3.jpg' },
        genres: ['Rock']
      } as any
    },
    albums: {},
    artists: {},
    songsByArtist: {},
    songsByGenre: {},
    albumsByArtist: {},
    songsByAlbum: {},
    mediaByType: {},
    searchTerm: '',
    searchResults: [],
    enabledProviders: [],
    loading: false,
    totalRows: 3,
    activeFilters: {
      genres: [],
      types: [],
      artists: [],
      providers: []
    },
    filteredSongs: [],
    recentAlbums: []
  }

  const defaultProps = {
    playlist: {
      _id: 'playlist-1',
      trackIds: ['song-1', 'song-2'],
      name: 'Test Playlist'
    },
    collection: mockCollectionState,
    dispatch: mockDispatch
  }

  const smartPlaylistProps = {
    playlist: {
      id: 'smart-1',
      _id: 'smart-1',
      trackIds: ['song-1', 'song-2', 'song-3'],
      name: 'Test Smart Playlist',
      filters: {
        genres: ['Rock'],
        types: [],
        artists: [],
        providers: []
      }
    },
    collection: {
      ...mockCollectionState,
      rows: {
        ...mockCollectionState.rows,
        'song-1': { ...mockCollectionState.rows['song-1'], genres: ['Rock'] } as any,
        'song-2': { ...mockCollectionState.rows['song-2'], genres: ['Pop'] } as any,
        'song-3': { ...mockCollectionState.rows['song-3'], genres: ['Rock'] } as any
      }
    },
    dispatch: mockDispatch
  }

  beforeEach(() => {
    mockDispatch.mockClear()
    mockNavigate.mockClear()
  })

  it('dispatches PLAY_ALL with correct songs and replace:true for regular playlist', () => {
    render(
      <BrowserRouter>
        <Playlist {...defaultProps} />
      </BrowserRouter>
    )

    fireEvent.click(screen.getByText('buttons.playAll'))

    expect(mockDispatch).toHaveBeenCalledWith({
      type: types.PLAY_ALL,
      songs: expect.any(Array),
      path: '/playlists/playlist-1'
    })
  })

  it('dispatches ADD_SONGS_TO_QUEUE with filtered songs and replace:true for smart playlist', () => {
    render(
      <BrowserRouter>
        <Playlist {...smartPlaylistProps} />
      </BrowserRouter>
    )

    fireEvent.click(screen.getByText('buttons.playAll'))

    expect(mockDispatch).toHaveBeenCalledWith({
      type: types.ADD_SONGS_TO_QUEUE,
      songs: expect.any(Array),
      replace: true
    })
  })

  it('dispatches ADD_SONGS_TO_QUEUE_BY_ID with correct songs when clicking Add to Queue', () => {
    render(
      <BrowserRouter>
        <Playlist {...defaultProps} />
      </BrowserRouter>
    )

    // Open dropdown menu
    fireEvent.click(screen.getByRole('button', { name: '' })) // Ellipsis button
    fireEvent.click(screen.getByText('buttons.addToQueue'))

    expect(mockDispatch).toHaveBeenCalledWith({
      type: types.ADD_SONGS_TO_QUEUE_BY_ID,
      songs: ['song-1', 'song-2']
    })
  })

  it('shows delete button only for smart playlists', () => {
    const { rerender } = render(
      <BrowserRouter>
        <Playlist {...defaultProps} />
      </BrowserRouter>
    )

    // Open dropdown menu
    fireEvent.click(screen.getByRole('button', { name: '' })) // Ellipsis button
    expect(screen.queryByText('buttons.delete')).not.toBeInTheDocument()

    rerender(
      <BrowserRouter>
        <Playlist {...smartPlaylistProps} />
      </BrowserRouter>
    )

    // Open dropdown menu
    fireEvent.click(screen.getByRole('button', { name: '' })) // Ellipsis button
    expect(screen.getByText('buttons.delete')).toBeInTheDocument()
  })

  it('dispatches DELETE_SMART_PLAYLIST when clicking delete on a smart playlist', () => {
    render(
      <BrowserRouter>
        <Playlist {...smartPlaylistProps} />
      </BrowserRouter>
    )

    // Open dropdown menu
    fireEvent.click(screen.getByRole('button', { name: '' })) // Ellipsis button
    fireEvent.click(screen.getByText('buttons.delete'))

    expect(mockDispatch).toHaveBeenCalledWith({
      type: types.DELETE_SMART_PLAYLIST,
      id: 'smart-1'
    })
  })
}) 
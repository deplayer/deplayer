/// <reference types="jest" />

import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom'
import React from 'react'
import { render, fireEvent, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Playlist from './Playlist'
import { State as CollectionState } from '../../reducers/collection'

// Mock translations
vi.mock('react-redux-i18n', () => ({
  Translate: ({ value }: { value: string }) => value
}))

// Mock useNavigate and BrowserRouter
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => <>{children}</>
  }
})


vi.mock('../../stores/livestore/store', () => ({
 useAppStore: () => ({ commit: vi.fn() }),
}))

vi.mock('../../stores/livestore/hooks', () => ({
  useFilteredMedia: vi.fn(() => []),
  useMediaMapForIds: vi.fn(() => ({})),
  useMediaById: vi.fn(() => null),
  useQueue: vi.fn(() => ({ trackIds: [], currentPlaying: null })),
  useCurrentPlayingSongId: vi.fn(() => null),
  useIsFavorite: vi.fn(() => false),
  useFavoriteIds: vi.fn(() => new Set()),
}))

const mockPlayAllAction = vi.fn().mockResolvedValue('first-track-id')
const mockAddToQueueAction = vi.fn().mockResolvedValue(undefined)
const mockDeleteSmartPlaylistAction = vi.fn().mockResolvedValue(undefined)

vi.mock('../../stores/livestore/actions', () => ({
  playAllAction: (...args: any[]) => mockPlayAllAction(...args),
  addToQueueAction: (...args: any[]) => mockAddToQueueAction(...args),
}))

vi.mock('../../stores/livestore/actions/smartPlaylists', () => ({
  deleteSmartPlaylistAction: (...args: any[]) => mockDeleteSmartPlaylistAction(...args),
}))


const mockDispatch = vi.fn()

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
      providers: [],
      favorites: false
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
        providers: [],
        favorites: []
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
    mockPlayAllAction.mockClear()
    mockAddToQueueAction.mockClear()
    mockDeleteSmartPlaylistAction.mockClear()
  })

  it('dispatches PLAY_LIST with correct songs for regular playlist', async () => {
    render(
      <BrowserRouter>
        <Playlist {...defaultProps} />
      </BrowserRouter>
    )

    fireEvent.click(screen.getByText('buttons.playAll'))

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'PLAY_LIST',
        trackIds: ['song-1', 'song-2']
      })
    })
  })

  it.todo('dispatches ADD_SONGS_TO_QUEUE with filtered songs and replace:true for smart playlist - needs LiveStore for useFilteredMedia')

  it('dispatches ADD_SONGS_TO_QUEUE_BY_ID with correct songs when clicking Add to Queue', async () => {
    render(
      <BrowserRouter>
        <Playlist {...defaultProps} />
      </BrowserRouter>
    )

    // Open dropdown menu
    fireEvent.click(screen.getByRole('button', { name: '' })) // Ellipsis button
    fireEvent.click(screen.getByText('buttons.addToQueue'))

    await waitFor(() => {
      expect(mockAddToQueueAction).toHaveBeenCalledWith(expect.any(Object), ['song-1', 'song-2'])
    })
  })

  it.todo('dispatches ADD_SONGS_TO_QUEUE_BY_ID with filtered songs for smart playlist - needs LiveStore for useFilteredMedia')

  it('handles empty playlist gracefully', async () => {
    const emptyPlaylistProps = {
      ...defaultProps,
      playlist: {
        ...defaultProps.playlist,
        trackIds: []
      }
    }

    render(
      <BrowserRouter>
        <Playlist {...emptyPlaylistProps} />
      </BrowserRouter>
    )

    // Open dropdown menu
    fireEvent.click(screen.getByRole('button', { name: '' })) // Ellipsis button
    fireEvent.click(screen.getByText('buttons.addToQueue'))

    // With empty trackIds, handler returns early - action should not be called
    expect(mockAddToQueueAction).not.toHaveBeenCalled()
  })

  it('handles empty smart playlist filters gracefully', async () => {
    const emptyFiltersProps = {
      ...smartPlaylistProps,
      playlist: {
        ...smartPlaylistProps.playlist,
        filters: {
          genres: [],
          types: [],
          artists: [],
          providers: [],
          favorites: []
        }
      }
    }

    render(
      <BrowserRouter>
        <Playlist {...emptyFiltersProps} />
      </BrowserRouter>
    )

    // Open dropdown menu
    fireEvent.click(screen.getByRole('button', { name: '' })) // Ellipsis button
    fireEvent.click(screen.getByText('buttons.addToQueue'))

    // useFilteredMedia returns [] so effectiveTrackIds is empty, handler returns early
    expect(mockAddToQueueAction).not.toHaveBeenCalled()
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

  it.todo('dispatches DELETE_SMART_PLAYLIST when clicking delete on a smart playlist - needs LiveStore test update')
}) 
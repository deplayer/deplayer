import { screen } from '@testing-library/react'
import { describe, it, expect, beforeAll, vi } from 'vitest'
import SongView from './index'
import Media from '../../entities/Media'
import { mediaParams } from '../../entities/Media.spec'
import Artist from '../../entities/Artist'
import Album from '../../entities/Album'
import { renderWithProviders, defaultTestState, TestState } from '../../utils/test-utils'
import { State as QueueState } from '../../reducers/queue'
import { State as CollectionState } from '../../reducers/collection'
import { State as PlayerState } from '../../reducers/player'
import { Dispatch } from 'redux'

vi.mock('../../stores/livestore/store', () => ({
  useAppStore: () => ({ commit: vi.fn() }),
}))

vi.mock('../../contexts/UIContext', () => ({
  useUI: () => ({
    searchTerm: '',
    searchActive: false,
    loading: false,
    ready: true,
    sidebarToggled: false,
    rightPanelToggled: false,
    showAddMediaModal: false,
    mqlMatch: false,
    heightMqlMatch: false,
    showSpectrum: false,
    showVisuals: false,
    displayMiniQueue: true,
    backgroundImage: '',
    activeFilters: { genres: [], types: [], artists: [], providers: [], favorites: false },
    toggleSidebar: vi.fn(),
    toggleRightPanel: vi.fn(),
    setShowAddMediaModal: vi.fn(),
    setMqlMatch: vi.fn(),
    setHeightMqlMatch: vi.fn(),
    toggleSpectrum: vi.fn(),
    toggleVisuals: vi.fn(),
    toggleMiniQueue: vi.fn(),
    setBackgroundImage: vi.fn(),
    setLoading: vi.fn(),
    setReady: vi.fn(),
    setFilter: vi.fn(),
    clearFilters: vi.fn(),
    setSearchTerm: vi.fn(),
    clearSearch: vi.fn(),
  }),
}))

vi.mock('../../stores/livestore/hooks', () => ({
  useQueue: vi.fn(() => ({ trackIds: [], currentPlaying: null })),
  useMediaById: vi.fn(() => null),
  useCurrentPlayingSongId: vi.fn(() => null),
  useIsFavorite: vi.fn(() => false),
  useFavoriteIds: vi.fn(() => new Set()),
}))

vi.mock('../../stores/livestore/hooks/useQueue', () => ({
  useQueue: vi.fn(() => ({ trackIds: [], currentPlaying: null })),
}))

vi.mock('../../stores/livestore/actions', () => ({
  addToQueueAction: vi.fn(),
  removeFromQueueAction: vi.fn(),
}))


interface Props {
  playerPortal: any
  location: Location
  player: PlayerState
  collection: CollectionState
  queue: QueueState
  songId: string
  dispatch: Dispatch
  loading: boolean
  className?: string | null
}

// Mock IntersectionObserver
beforeAll(() => {
  const mockIntersectionObserver = vi.fn()
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null
  })
  window.IntersectionObserver = mockIntersectionObserver
})

const createTestSong = () => {
  const mockArtist = new Artist({
    id: 'artist-1',
    name: 'Pink Floyd'
  })

  const mockAlbum = new Album({
    id: 'album-1',
    name: 'The Wall',
    artist: mockArtist
  })

  return new Media({
    ...mediaParams,
    id: 'test-song-1',
    title: 'Comfortably Numb',
    artist: mockArtist,
    album: mockAlbum,
    artistName: "Pink Floyd",
    albumName: "The Wall",
    type: 'audio',
    duration: 383,
    cover: {
      thumbnailUrl: 'http://example.com/thumbnail.jpg',
      fullUrl: 'http://example.com/full.jpg'
    },
    stream: {
      subsonic: {
        service: 'subsonic',
        uris: [{ uri: 'http://example.com/stream' }]
      }
    },
    genres: ['Rock', 'Progressive Rock'],
    playCount: 0
  })
}

interface TestSetup {
  props: Props
  song: Media
}

const createTestProps = (customProps: Partial<Props> = {}): TestSetup => {
  const song = createTestSong()

  const defaultProps: Props = {
    songId: song.id,
    dispatch: vi.fn(),
    playerPortal: document.createElement('div'),
    loading: false,
    className: '',
    collection: {
      ...defaultTestState.collection!,
      rows: {
        [song.id]: song
      },
      albums: {
        [song.album.id]: song.album
      },
      albumsByArtist: {
        [song.artist.id]: [song.album.id]
      },
      songsByGenre: {
        'Rock': [song.id],
        'Progressive Rock': [song.id]
      },
      songsByAlbum: {
        [song.album.id]: [song.id]
      }
    },
    queue: {
      ...defaultTestState.queue!,
      trackIds: [],
      currentPlaying: null
    },
    player: {
      ...defaultTestState.player!,
      playing: false,
      currentTime: 0,
      duration: song.duration
    },
    location: window.location
  }

  return { 
    props: { ...defaultProps, ...customProps },
    song
  }
}

const createTestState = (setup: TestSetup): Partial<TestState> => ({
  ...defaultTestState,
  collection: setup.props.collection,
  queue: setup.props.queue,
  player: setup.props.player
})

describe('SongView', () => {
  it('spinner if app loading', async () => {
    const { props, song } = createTestProps({ loading: true })
    const state = createTestState({ props, song })
    renderWithProviders(
      <SongView {...props} />, 
      { initialState: state }
    )
    expect(screen.getByTestId('spinner')).toBeTruthy()
  })

  it('render song without crash', () => {
    const { props, song } = createTestProps()
    const state = createTestState({ props, song })
    renderWithProviders(
      <SongView {...props} />, 
      { initialState: state }
    )

    expect(screen.getByTestId('song-view')).toBeTruthy()
  })
})


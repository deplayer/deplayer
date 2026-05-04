import { screen } from '@testing-library/react'
import { describe, it, expect, beforeAll, vi } from 'vitest'
import SongView from './index'
import type { MediaRow } from '../../types/media'
import { renderWithProviders, defaultTestState, TestState } from '../../utils/test-utils'
import { State as QueueState } from '../../reducers/queue'
import { State as CollectionState } from '../../reducers/collection'
import { State as PlayerState } from '../../reducers/player'
import { Dispatch } from 'redux'

vi.mock('../../stores/livestore/store', () => ({
  useAppStore: () => ({ commit: vi.fn() }),
}))

vi.mock('../../stores/livestore/hooks', () => ({
  useQueue: vi.fn(() => ({ trackIds: [], currentPlaying: null })),
  useMediaById: vi.fn(() => null),
  useCurrentPlayingSongId: vi.fn(() => null),
  useIsFavorite: vi.fn(() => false),
  useFavoriteIds: vi.fn(() => new Set()),
  useRecommendations: vi.fn(() => []),
  useLyrics: vi.fn(() => null),
}))

vi.mock('../../stores/livestore/hooks/useRecommendations', () => ({
  useRecommendations: vi.fn(() => []),
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

const createTestSong = (): MediaRow => {
  return {
    id: 'test-song-1',
    title: 'Comfortably Numb',
    artistId: 'artist-1',
    albumId: 'album-1',
    artistName: 'Pink Floyd',
    albumName: 'The Wall',
    type: 'audio',
    duration: 383,
    playCount: 0,
    track: null,
    discNumber: null,
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
    externalId: null,
    shareUrl: null,
    filePath: null,
    genresFlat: 'Rock,Progressive Rock',
    providersFlat: 'subsonic',
  }
}

interface TestSetup {
  props: Props
  song: MediaRow
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
        [song.albumId]: { id: song.albumId, name: song.albumName, artistId: song.artistId, thumbnailUrl: null, year: null }
      },
      albumsByArtist: {
        [song.artistId]: [song.albumId]
      },
      songsByGenre: {
        'Rock': [song.id],
        'Progressive Rock': [song.id]
      },
      songsByAlbum: {
        [song.albumId]: [song.id]
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

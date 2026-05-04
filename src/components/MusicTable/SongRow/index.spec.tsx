import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BrowserRouter as Router } from 'react-router-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import type { MediaRow } from '../../../types/media'
import SongRow from './index'
import type { Props } from './index'

vi.mock('../../../stores/livestore/store', () => ({
  useAppStore: () => ({ commit: vi.fn() }),
}))

vi.mock('../../../stores/livestore/hooks', () => ({
  useMediaById: vi.fn(() => null),
  useQueue: vi.fn(() => ({ trackIds: [], currentPlaying: null })),
  useCurrentPlayingSongId: vi.fn(() => null),
  useIsFavorite: vi.fn(() => false),
  useFavoriteIds: vi.fn(() => new Set()),
}))

vi.mock('../../../stores/livestore/actions', () => ({
  toggleFavoriteAction: vi.fn(),
  addToQueueAction: vi.fn(),
  removeFromQueueAction: vi.fn(),
}))

// Create a mock store
const createMockStore = () => configureStore({
  reducer: {
    favorites: (state = { favoriteIds: new Set() }) => state,
  }
})

const setup = (overrideProps = {}) => {
  const mockOnClick = vi.fn()
  const mockSong: MediaRow = {
    id: 'artist-name-album-name-undefined-title',
    title: 'title',
    cover: { thumbnailUrl: 'thumbnail', fullUrl: '' },
    artistId: '1',
    albumId: 'foo',
    artistName: 'artistName',
    albumName: 'album',
    type: 'audio',
    duration: 100,
    playCount: 0,
    track: null,
    discNumber: null,
    stream: {},
    genres: [],
    externalId: null,
    shareUrl: null,
    filePath: null,
    genresFlat: '',
    providersFlat: '',
  }

  const props: Props = {
    dispatch: (_action: any) => _action,
    song: mockSong,
    queue: {
      trackIds: [],
      randomTrackIds: [],
      currentPlaying: null,
      repeat: false,
      shuffle: false,
      nextSongId: null,
      prevSongId: null,
    },
    onClick: mockOnClick,
    isCurrent: false,
    style: {},
    disableAddButton: false,
    disableCovers: false,
    mqlMatch: true,
    slim: false,
    ...overrideProps
  }

  const store = createMockStore()

  const utils = render(
    <Provider store={store}>
      <Router>
        <SongRow {...props} />
      </Router>
    </Provider>
  )
  return { ...utils, props, mockOnClick }
}

describe('SongRow', () => {
  it('should show render without errors', () => {
    setup()
    expect(screen.getByTestId('song-row')).toBeTruthy()
  })

  it('should trigger onClick when cover image is clicked', () => {
    const { mockOnClick, container } = setup()
    const coverElement = container.querySelector('[data-testid="song-cover"]')
    expect(coverElement).toBeTruthy()
    fireEvent.click(coverElement!)
    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })
})

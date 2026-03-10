import { screen, render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import ArtistView from './index'

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ id: 'artist-1' }),
  }
})

vi.mock('../../stores/livestore/store', () => ({
 useAppStore: () => ({ commit: vi.fn() }),
}))

vi.mock('../../stores/livestore/hooks', () => ({
  useArtistById: vi.fn(() => ({ id: 'artist-1', name: 'Test Artist' })),
  useAlbumsByArtist: vi.fn(() => []),
  useSongsByAlbumForArtist: vi.fn(() => ({ songsByAlbum: {}, mediaMap: {} })),
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
  playAllAction: vi.fn(),
  addToQueueAction: vi.fn(),
  removeFromQueueAction: vi.fn(),
  toggleFavoriteAction: vi.fn(),
}))


const createMockStore = () => configureStore({
  reducer: {
    artist: (state = { artistMetadata: {} }) => state,
    collection: (state = { rows: {}, albums: {}, songsByAlbum: {}, albumsByArtist: {} }) => state,
    queue: (state = { trackIds: [], currentPlaying: null }) => state,
  }
})

const setup = () => {
  const store = createMockStore()
  render(
    <Provider store={store}>
      <BrowserRouter>
        <ArtistView />
      </BrowserRouter>
    </Provider>
  )
}

describe('ArtisView', () => {
  it('render song without crash', () => {
    setup()
    expect(screen.getByTestId('artist-view')).toBeTruthy()
  })
})

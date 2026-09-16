import { screen, render } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import ArtistView from './index'
import { useArtistById, useAlbumsByArtist, useSongsByAlbumForArtist } from '../../stores/livestore/hooks'

const setBackgroundImage = vi.hoisted(() => vi.fn())
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ id: 'artist-1' }),
  }
})
vi.mock('../../stores/uiStore', () => ({
  useUIStore: vi.fn(() => setBackgroundImage),
}))

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
  const dispatchSpy = vi.spyOn(store, 'dispatch')
  const view = render(
    <Provider store={store}>
      <BrowserRouter>
        <ArtistView />
      </BrowserRouter>
    </Provider>
  )
  return { ...view, store, dispatchSpy }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ArtisView', () => {
  it('render song without crash', () => {
    setup()
    expect(screen.getByTestId('artist-view')).toBeTruthy()
  })

  it('fetches an artist once while reactive media updates', () => {
    vi.mocked(useArtistById)
      .mockReturnValueOnce({ id: 'artist-1', name: 'Test Artist', createdAt: 0, updatedAt: 0 })
      .mockImplementation(() => ({ id: 'artist-1', name: 'Test Artist', createdAt: 0, updatedAt: 0 }))
    vi.mocked(useAlbumsByArtist)
      .mockReturnValueOnce([])
      .mockReturnValue([{ id: 'album-1' }] as never)
    vi.mocked(useSongsByAlbumForArtist)
      .mockReturnValueOnce({ songsByAlbum: {}, mediaMap: {}, allSongIds: [] })
      .mockReturnValue({
        songsByAlbum: { 'album-1': ['song-1'] },
        mediaMap: {
          'song-1': {
            id: 'song-1',
            playCount: 0,
            genres: [],
            cover: { fullUrl: 'https://example.com/cover.jpg' },
          },
        },
      } as never)

    const { rerender, store, dispatchSpy } = setup()
    rerender(
      <Provider store={store}>
        <BrowserRouter>
          <ArtistView />
        </BrowserRouter>
      </Provider>
    )

    const dispatchedTypes = dispatchSpy.mock.calls.map(([action]) => {
      if (typeof action === 'object' && action !== null && 'type' in action && typeof action.type === 'string') {
        return action.type
      }
      return ''
    })

    expect(dispatchedTypes.filter((type) => type === 'LOAD_ARTIST')).toHaveLength(1)
    expect(dispatchedTypes.filter((type) => type === 'FETCH_ARTIST_SONGS')).toHaveLength(1)
    expect(setBackgroundImage).toHaveBeenLastCalledWith('https://example.com/cover.jpg')
  })
})

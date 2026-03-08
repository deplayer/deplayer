import { render, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import CommandBar from './index'
import { createDefaultState } from '../../test-utils/store'
import * as searchActions from '../../types/search'
import { State as RootState } from '../../reducers'
import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'

// Mock search actions
vi.mock('../../types/search', () => ({
  startSearch: vi.fn((searchTerm: string, provider: string, noRedirect: boolean) => ({
    type: 'START_SEARCH',
    searchTerm,
    provider,
    noRedirect
  }))
}))

vi.mock('../../stores/livestore/store', () => ({
 useAppStore: () => ({ commit: vi.fn() }),
}))

vi.mock('../../stores/livestore/hooks', () => ({
  useQueue: vi.fn(() => ({ trackIds: [], currentPlaying: null })),
  useMediaById: vi.fn(() => null),
  useCurrentPlayingSongId: vi.fn(() => null),
  useIsFavorite: vi.fn(() => false),
  useFavoriteIds: vi.fn(() => new Set()),
  useSearchMediaIds: vi.fn(() => []),
  useMediaMapForIds: vi.fn(() => ({})),
}))

vi.mock('../../stores/livestore/hooks/useQueue', () => ({
  useQueue: vi.fn(() => ({ trackIds: [], currentPlaying: null })),
}))

vi.mock('../../stores/livestore/actions', () => ({
  playAllAction: vi.fn(),
  addToQueueAction: vi.fn(),
  removeFromQueueAction: vi.fn(),
}))

vi.mock('../../contexts', () => ({
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


describe('CommandBar', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  const defaultProps = {
    dispatch: vi.fn(),
    searchResults: [],
    loading: false,
    collection: {
      songs: [],
      albums: [],
      artists: []
    },
    togglePlaying: vi.fn(),
    playNext: vi.fn(),
    playPrev: vi.fn(),
    navigateToArtists: vi.fn(),
    navigateToAlbums: vi.fn(),
    navigateToQueue: vi.fn(),
    navigateToPlaylists: vi.fn(),
    navigateToSettings: vi.fn(),
    navigateToExplore: vi.fn()
  }

  const setup = (customState: Partial<RootState> = {}) => {
    const initialState = {
      search: {
        error: '',
        searchTerm: '',
        loading: false,
        searchToggled: false,
        searchResults: []
      },
      collection: {
        ...createDefaultState().collection,
        searchResults: [],
        rows: {}
      },
      i18n: {
        translations: {},
        locale: 'en'
      },
      ...customState
    }

    const store = configureStore({
      reducer: (state = initialState) => state,
      preloadedState: initialState
    })

    return render(
      <Provider store={store}>
        <BrowserRouter>
          <CommandBar {...defaultProps} />
        </BrowserRouter>
      </Provider>
    )
  }

  it('renders search button', () => {
    const { getByTestId } = setup()
    expect(getByTestId('search-button')).toBeInTheDocument()
  })

  it('opens modal on Cmd+K', async () => {
    const { getByTestId } = setup()
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    await vi.advanceTimersByTimeAsync(100)
    expect(getByTestId('command-search-input')).toBeInTheDocument()
  })

  it('dispatches search action with correct payload after debounce', async () => {
    const { getByTestId } = setup()
    
    // Open modal
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    await vi.advanceTimersByTimeAsync(100)

    // Type search query
    const input = getByTestId('command-search-input')
    fireEvent.change(input, { target: { value: 'test query' } })

    // Wait for debounce
    await vi.advanceTimersByTimeAsync(500)

    expect(searchActions.startSearch).toHaveBeenCalledWith('test query', 'all', true)
  })

  it('does not dispatch search action immediately on input', async () => {
    const { getByTestId } = setup()
    
    // Open modal
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    await vi.advanceTimersByTimeAsync(100)
    
    // Clear any previous calls
    vi.clearAllMocks()
    
    // Get input and type
    const input = getByTestId('command-search-input')
    fireEvent.change(input, { target: { value: 'test query' } })
    
    // Check that search is not dispatched immediately
    expect(searchActions.startSearch).not.toHaveBeenCalled()
  })

  it.todo('shows loading state while searching - needs LiveStore mock for search state')

  it('shows no results message when search returns empty', async () => {
    const { getByTestId } = setup({
      collection: {
        ...createDefaultState().collection,
        searchResults: [],
        loading: false
      },
      search: {
        error: '',
        searchTerm: 'test query',
        loading: false,
        searchToggled: true,
        searchResults: []
      }
    })
    
    // Open modal
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    await vi.advanceTimersByTimeAsync(100)
    
    // Type search query
    const input = getByTestId('command-search-input')
    fireEvent.change(input, { target: { value: 'test query' } })
    
    // Wait for debounce
    await vi.advanceTimersByTimeAsync(500)
    
    expect(getByTestId('search-no-results')).toBeInTheDocument()
  })

  it.todo('displays search results with correct types - needs LiveStore mock for useSearchMediaIds')
}) 
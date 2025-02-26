import { render, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import CommandBar from './index'
import { createDefaultState } from '../../test-utils/store'
import * as searchActions from '../../types/search'
import { State as RootState } from '../../reducers'
import Media from '../../entities/Media'
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

  it('shows loading state while searching', async () => {
    const { getByTestId } = setup({
      collection: {
        ...createDefaultState().collection,
        loading: true
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
    
    expect(getByTestId('search-loading')).toBeInTheDocument()
  })

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

  it('displays search results with correct types', async () => {
    const mockSong = {
      id: 'song1',
      title: 'Test Song',
      type: 'song',
      artist: { name: 'Test Artist' },
      album: { name: 'Test Album' },
      cover: { thumbnailUrl: 'test-cover.jpg' }
    }

    const { getByTestId } = setup({
      collection: {
        ...createDefaultState().collection,
        searchResults: ['song1'],
        rows: {
          song1: mockSong as Media
        }
      }
    })
    
    // Open modal
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    await vi.advanceTimersByTimeAsync(100)
    
    // Type search query
    const input = getByTestId('command-search-input')
    fireEvent.change(input, { target: { value: 'test' } })
    
    // Wait for debounce
    await vi.advanceTimersByTimeAsync(500)
    
    // Check for the songs group
    expect(getByTestId('search-group-songs')).toBeInTheDocument()
  })
}) 
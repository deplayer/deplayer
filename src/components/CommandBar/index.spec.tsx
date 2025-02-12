import { cleanup, act, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import CommandBar from './index'
import { renderWithProviders } from '../../test-utils/render'
import { createDefaultState } from '../../test-utils/store'
import { I18n } from 'react-redux-i18n'
import { AnyAction } from 'redux'
import { ThunkDispatch } from 'redux-thunk'
import * as searchActions from '../../types/search'

// Define minimal types for store state
interface StoreState {
  collection: {
    searchResults: string[]
    loading: boolean
    rows: Record<string, any>
  }
  settings: Record<string, any>
  search: Record<string, any>
  [key: string]: any
}

type AppDispatch = ThunkDispatch<StoreState, undefined, AnyAction>

// Mock translations
vi.mock('react-redux-i18n', () => ({
  I18n: {
    t: (key: string) => {
      const translations: { [key: string]: string } = {
        'menu.searching': 'searching...',
        'menu.noResults': 'No results found',
        'menu.searchPlaceholder': 'Search...',
        'menu.search': 'Search',
        'commandBar.categories.themes': 'themes',
        'commandBar.categories.commands': 'commands',
        'commandBar.categories.songs': 'songs',
        'menu.navigate': 'Navigate',
        'menu.select': 'Select',
        'menu.close': 'Close'
      }
      return translations[key] || key
    }
  },
  Translate: ({ value }: { value: string }) => I18n.t(value)
}))

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
    vi.useFakeTimers()
  })

  afterEach(() => {
    // Run all pending timers and cleanup
    act(() => {
      vi.runAllTimers()
    })
    cleanup()
    vi.clearAllMocks()
    vi.useRealTimers()
    localStorage.clear()
  })

  const setup = (customState: Partial<StoreState> = {}) => {
    const defaultState = createDefaultState()
    const initialState = {
      ...defaultState,
      ...customState
    }

    const result = renderWithProviders(
      <CommandBar 
        navigateToArtists={() => {}}
        navigateToAlbums={() => {}}
        navigateToQueue={() => {}}
        navigateToPlaylists={() => {}}
        navigateToSettings={() => {}}
        navigateToExplore={() => {}}
      />,
      { initialState }
    )

    return result
  }

  it('renders search button', () => {
    const { getByText } = setup()
    expect(getByText('Search...')).toBeTruthy()
  })

  it('opens modal on Cmd+K', () => {
    const { getByTestId } = setup()
    
    // Simulate Cmd+K
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    
    expect(getByTestId('command-search-input')).toBeTruthy()
  })

  it('dispatches search action with correct payload after debounce', async () => {
    const { getByTestId } = setup()
    
    // Open modal
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    
    // Type in search with a term that won't match any local items
    const searchTerm = 'xyz123nonexistent'
    await act(async () => {
      fireEvent.change(getByTestId('command-search-input'), { target: { value: searchTerm } })
      vi.advanceTimersByTime(500)
    })
    
    expect(searchActions.startSearch).toHaveBeenCalledWith(searchTerm, 'all', true)
  })

  it('does not dispatch search action immediately on input', () => {
    const { getByTestId } = setup()
    
    // Open modal
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    
    // Type in search
    fireEvent.change(getByTestId('command-search-input'), { target: { value: 'test' } })
    
    expect(searchActions.startSearch).not.toHaveBeenCalled()
  })

  it("shows loading state while searching", () => {
    const { getByText, getByTestId } = setup({
      collection: {
        ...createDefaultState().collection,
        loading: true
      }
    })
    
    // Open modal
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    
    // Type search text to trigger loading state
    fireEvent.change(getByTestId('command-search-input'), { target: { value: 'test search' } })
    
    // Now we can check for the loading state
    expect(getByText("searching...")).toBeTruthy()
  })

  it("shows no results message when search returns empty", async () => {
    const { getByText, getByTestId } = setup()
    
    // Open modal
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    
    // Type search text to trigger no results state
    await act(async () => {
      fireEvent.change(getByTestId('command-search-input'), { target: { value: 'test search' } })
      vi.advanceTimersByTime(500)
    })
    
    expect(getByText("No results found")).toBeTruthy()
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

    const { getByText, getByTestId } = setup({
      collection: {
        ...createDefaultState().collection,
        searchResults: ['song1'],
        rows: {
          song1: mockSong
        }
      }
    })
    
    // Open modal
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    
    // Type search text to trigger results display
    await act(async () => {
      fireEvent.change(getByTestId('command-search-input'), { target: { value: 'test' } })
      vi.advanceTimersByTime(500)
    })
    
    // First check for the songs category
    expect(getByText('songs')).toBeTruthy()
    
    // Then check for the song details
    expect(getByText('Test Song')).toBeTruthy()
    expect(getByText('Test Artist - Test Album')).toBeTruthy()
  })
}) 
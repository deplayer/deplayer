import { render, fireEvent, cleanup, act } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import CommandBar from './index'
import { BrowserRouter } from 'react-router-dom'
import { I18n } from 'react-redux-i18n'
import { AnyAction } from 'redux'
import { ThunkDispatch } from 'redux-thunk'

interface StoreState {
  collection: {
    searchResults: string[]
    loading: boolean
    rows: Record<string, any>
  }
  settings: Record<string, any>
  search: Record<string, any>
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
        'menu.navigate': 'Navigate',
        'menu.select': 'Select',
        'menu.close': 'Close'
      }
      return translations[key] || key
    }
  },
  Translate: ({ value }: { value: string }) => I18n.t(value)
}))

const createMockStore = (initialState: Partial<StoreState> = {}) => {
  const defaultState: StoreState = {
    collection: {
      searchResults: [],
      loading: false,
      rows: {}
    },
    settings: {},
    search: {}
  }

  return configureStore({
    reducer: {
      collection: (state = defaultState.collection, _action: AnyAction) => state,
      settings: (state = defaultState.settings, _action: AnyAction) => state,
      search: (state = defaultState.search, _action: AnyAction) => state,
    },
    preloadedState: { ...defaultState, ...initialState },
  })
}

const renderWithRedux = (component: React.ReactNode, initialState: Partial<StoreState> = {}) => {
  const store = createMockStore(initialState)
  return {
    ...render(
      <Provider store={store}>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </Provider>
    ),
    store,
  }
}

describe('CommandBar', () => {
  let store: ReturnType<typeof createMockStore>

  beforeEach(() => {
    vi.useFakeTimers()
    store = createMockStore({
      collection: {
        searchResults: [],
        loading: false,
        rows: {}
      }
    })
    store.dispatch = vi.fn() as unknown as AppDispatch
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.useRealTimers()
    localStorage.clear()
  })

  const renderComponent = () => {
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <CommandBar 
            navigateToArtists={() => {}}
            navigateToAlbums={() => {}}
            navigateToQueue={() => {}}
            navigateToPlaylists={() => {}}
            navigateToSettings={() => {}}
            navigateToExplore={() => {}}
          />
        </BrowserRouter>
      </Provider>
    )
  }

  it('renders search button', () => {
    const { getByText } = renderComponent()
    expect(getByText('Search...')).toBeTruthy()
  })

  it('opens modal on Cmd+K', () => {
    const { getByTestId } = renderComponent()
    
    // Simulate Cmd+K
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    
    expect(getByTestId('command-search-input')).toBeTruthy()
  })

  it('dispatches search action with correct payload after debounce', async () => {
    const { getByTestId } = renderComponent()
    
    // Open modal
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    
    // Type in search
    fireEvent.change(getByTestId('command-search-input'), { target: { value: 'test' } })
    
    // Fast-forward timers
    await act(async () => {
      vi.advanceTimersByTime(500)
    })
    
    expect(store.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'START_SEARCH',
      searchTerm: 'test'
    }))
  })

  it('does not dispatch search action immediately on input', () => {
    const { getByTestId } = renderComponent()
    
    // Open modal
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    
    // Type in search
    fireEvent.change(getByTestId('command-search-input'), { target: { value: 'test' } })
    
    expect(store.dispatch).not.toHaveBeenCalledWith(expect.objectContaining({
      type: 'START_SEARCH'
    }))
  })

  it("shows loading state while searching", () => {
    const initialState = {
      collection: {
        searchResults: [],
        loading: true,
        rows: {}
      },
    };

    const { getByText, getByTestId } = renderWithRedux(
      <CommandBar 
        navigateToArtists={() => {}}
        navigateToAlbums={() => {}}
        navigateToQueue={() => {}}
        navigateToPlaylists={() => {}}
        navigateToSettings={() => {}}
        navigateToExplore={() => {}}
      />, 
      initialState
    );
    
    // Open modal
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    
    // Type search text to trigger loading state
    fireEvent.change(getByTestId('command-search-input'), { target: { value: 'test search' } });
    
    // Now we can check for the loading state
    expect(getByText("searching...")).toBeTruthy();
  });

  it("shows no results message when search returns empty", () => {
    const initialState = {
      collection: {
        searchResults: [],
        loading: false,
        rows: {}
      },
    };

    const { getByText, getByTestId } = renderWithRedux(
      <CommandBar 
        navigateToArtists={() => {}}
        navigateToAlbums={() => {}}
        navigateToQueue={() => {}}
        navigateToPlaylists={() => {}}
        navigateToSettings={() => {}}
        navigateToExplore={() => {}}
      />, 
      initialState
    );
    
    // Open modal
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    
    // Type search text to trigger no results state
    fireEvent.change(getByTestId('command-search-input'), { target: { value: 'test search' } });
    
    // Wait for search to complete
    act(() => {
      vi.advanceTimersByTime(500);
    });
    
    expect(getByText("No results found")).toBeTruthy();
  });

  it('displays search results with correct types', () => {
    store = createMockStore({
      collection: {
        searchResults: ['song1'],
        loading: false,
        rows: {
          song1: { 
            id: 'song1', 
            title: 'Test Song',
            type: 'song',
            artist: { id: 'artist1', name: 'Test Artist' },
            album: { id: 'album1', name: 'Test Album' }
          }
        }
      }
    })

    const { getByText, getByTestId } = renderComponent()
    
    // Open modal
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    
    // Type in search to trigger results
    fireEvent.change(getByTestId('command-search-input'), { target: { value: 'test' } })
    
    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(getByText('Test Song')).toBeTruthy()
  })

  it('dispatches view action on result selection', () => {
    store = createMockStore({
      collection: {
        searchResults: ['song1'],
        loading: false,
        rows: {
          song1: { 
            id: 'song1', 
            title: 'Test Song',
            type: 'song',
            artist: { id: 'artist1', name: 'Test Artist' },
            album: { id: 'album1', name: 'Test Album' }
          }
        }
      }
    })

    const { getByText, getByTestId } = renderComponent()
    
    // Open modal
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    
    // Type in search to trigger results
    fireEvent.change(getByTestId('command-search-input'), { target: { value: 'test' } })
    
    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(500)
    })

    // Click on result
    fireEvent.click(getByText('Test Song'))
  })

  it('shows themes in search results', () => {
    const { getByTestId, getByText } = renderComponent()
    
    // Open modal
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    
    // Type theme name
    fireEvent.change(getByTestId('command-search-input'), { target: { value: 'dracula' } })
    
    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(getByText('Dracula')).toBeTruthy()
  })

  it('changes theme when selecting a theme item', () => {
    const { getByTestId, getByText } = renderComponent()
    
    // Open modal
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    
    // Type theme name
    fireEvent.change(getByTestId('command-search-input'), { target: { value: 'dracula' } })
    
    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(500)
    })

    // Click on theme
    fireEvent.click(getByText('Dracula'))

    expect(localStorage.getItem('theme')).toBe('dracula')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dracula')
  })

  it('shows all themes when searching for "theme"', () => {
    const { getByTestId, getByText } = renderComponent()
    
    // Open modal
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    
    // Type "theme"
    fireEvent.change(getByTestId('command-search-input'), { target: { value: 'theme' } })
    
    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(500)
    })

    // Check for theme section
    expect(getByText('themes')).toBeTruthy()

    // Check for some theme options
    expect(getByText('Deplayer')).toBeTruthy()
    expect(getByText('Dark')).toBeTruthy()
    expect(getByText('Light')).toBeTruthy()
  })

  it('filters themes based on search input', () => {
    const { getByTestId, getByText, queryByText } = renderComponent()
    
    // Open modal
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    
    // Type "dark"
    fireEvent.change(getByTestId('command-search-input'), { target: { value: 'dark' } })
    
    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(500)
    })

    // Should show dark theme
    expect(getByText('Dark')).toBeTruthy()
    
    // Should not show light theme
    expect(queryByText('Light')).toBeFalsy()
  })

  it('navigates themes with keyboard', () => {
    const { getByTestId } = renderComponent()
    
    // Open modal
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    
    // Type "theme"
    fireEvent.change(getByTestId('command-search-input'), { target: { value: 'theme' } })
    
    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(500)
    })

    // Press arrow down to select first theme
    fireEvent.keyDown(getByTestId('command-search-input'), { key: 'ArrowDown' })
    
    // Press enter to select
    fireEvent.keyDown(getByTestId('command-search-input'), { key: 'Enter' })

    expect(localStorage.getItem('theme')).toBeTruthy()
    expect(document.documentElement.getAttribute('data-theme')).toBeTruthy()
  })
}) 
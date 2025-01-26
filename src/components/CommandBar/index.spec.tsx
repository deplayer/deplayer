import { render, fireEvent, cleanup, act } from '@testing-library/react'
import { Provider } from 'react-redux'
import configureStore from 'redux-mock-store'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import CommandBar from './index'
import { BrowserRouter } from 'react-router-dom'

const mockStore = configureStore([])

describe('CommandBar', () => {
  let store: any

  beforeEach(() => {
    vi.useFakeTimers()
    store = mockStore({
      collection: {
        searchResults: [],
        loading: false,
        artists: {},
        albums: {},
        rows: {}
      }
    })
    store.dispatch = vi.fn()
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

  it('shows loading state while searching', () => {
    store = mockStore({
      collection: {
        searchResults: [],
        loading: true,
        artists: {},
        albums: {},
        rows: {}
      }
    })

    const { getByTestId, getByText } = renderComponent()
    
    // Open modal
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    
    // Type in search
    fireEvent.change(getByTestId('command-search-input'), { target: { value: 'test' } })
    
    expect(getByText('Searching...')).toBeTruthy()
  })

  it('shows no results message when search returns empty', () => {
    const { getByTestId, getByText } = renderComponent()
    
    // Open modal
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    
    // Type in search
    fireEvent.change(getByTestId('command-search-input'), { target: { value: 'test' } })
    
    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(500)
    })
    
    expect(getByText('No results found')).toBeTruthy()
  })

  it('displays search results with correct types', () => {
    store = mockStore({
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
    store = mockStore({
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
    expect(getByText('Themes')).toBeTruthy()

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
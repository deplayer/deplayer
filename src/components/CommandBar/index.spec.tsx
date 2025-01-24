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
    
    // Wait for debounce
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 500))
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
            artist: { id: 'artist1', name: 'Test Artist' },
            album: { id: 'album1', name: 'Test Album' }
          }
        }
      }
    })

    const { getByText } = renderComponent()
    
    // Open modal
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    
    expect(getByText('Test Song')).toBeTruthy()
    expect(getByText('song')).toBeTruthy()
  })

  it('navigates results with arrow keys', () => {
    store = mockStore({
      collection: {
        searchResults: ['song1'],
        loading: false,
        artists: {},
        albums: {},
        rows: {
          song1: { id: 'song1', title: 'Test Song' }
        }
      }
    })

    const { getByTestId } = renderComponent()
    
    // Open modal
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    
    // Press arrow down
    fireEvent.keyDown(getByTestId('command-search-input'), { key: 'ArrowDown' })
    
    // Press arrow up
    fireEvent.keyDown(getByTestId('command-search-input'), { key: 'ArrowUp' })
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
            artist: { id: 'artist1', name: 'Test Artist' },
            album: { id: 'album1', name: 'Test Album' }
          }
        }
      }
    })

    const { getByText } = renderComponent()
    
    // Open modal
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    
    // Click on result
    fireEvent.click(getByText('Test Song'))
  })
}) 
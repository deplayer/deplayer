import { fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import CommandBar from './index'
import { renderWithProviders } from '../../test-utils/render'
import { createDefaultState } from '../../test-utils/store'
import { I18n } from 'react-redux-i18n'
import * as searchActions from '../../types/search'
import { State as RootState } from '../../reducers'
import Media from '../../entities/Media'
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
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  const setup = (customState: Partial<RootState> = {}) => {
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
    expect(getByText('Search...')).toBeInTheDocument()
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
    const { getByTestId, getByText } = setup({
      collection: {
        ...createDefaultState().collection,
        loading: true
      }
    })
    
    // Open modal
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    await vi.advanceTimersByTimeAsync(100)
    
    // Get input and type
    const input = getByTestId('command-search-input')
    fireEvent.change(input, { target: { value: 'test query' } })
    
    // Wait for debounce
    await vi.advanceTimersByTimeAsync(500)
    
    expect(getByText('searching...')).toBeInTheDocument()
  })

  it('shows no results message when search returns empty', async () => {
    const { getByTestId, getByText } = setup({
      collection: {
        ...createDefaultState().collection,
        searchResults: []
      }
    })
    
    // Open modal
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    await vi.advanceTimersByTimeAsync(100)
    
    // Get input and type
    const input = getByTestId('command-search-input')
    fireEvent.change(input, { target: { value: 'test query' } })
    
    // Wait for debounce
    await vi.advanceTimersByTimeAsync(500)
    
    expect(getByText('No results found')).toBeInTheDocument()
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

    const { getByTestId, getByText } = setup({
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
    
    // Get input and type
    const input = getByTestId('command-search-input')
    fireEvent.change(input, { target: { value: 'test' } })
    
    // Wait for debounce
    await vi.advanceTimersByTimeAsync(500)
    
    // First check for the songs category
    expect(getByText('songs')).toBeInTheDocument()
    
    // Then check for the song details
    expect(getByText('Test Song')).toBeInTheDocument()
    expect(getByText('Test Artist - Test Album')).toBeInTheDocument()
  })
}) 
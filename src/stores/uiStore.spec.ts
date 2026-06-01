import { describe, it, expect, beforeEach } from 'vitest'
import { useUIStore } from './uiStore'

describe('useUIStore searchOpen', () => {
  beforeEach(() => {
    useUIStore.setState({
      searchOpen: false,
      searchResults: [],
      searchTerm: '',
      searchActive: false,
    })
  })

  it('toggleSearch flips searchOpen', () => {
    expect(useUIStore.getState().searchOpen).toBe(false)
    useUIStore.getState().toggleSearch()
    expect(useUIStore.getState().searchOpen).toBe(true)
    useUIStore.getState().toggleSearch()
    expect(useUIStore.getState().searchOpen).toBe(false)
  })

  it('closeSearch forces searchOpen false', () => {
    useUIStore.setState({ searchOpen: true })
    useUIStore.getState().closeSearch()
    expect(useUIStore.getState().searchOpen).toBe(false)
    // Idempotent
    useUIStore.getState().closeSearch()
    expect(useUIStore.getState().searchOpen).toBe(false)
  })

  it('setSearchResults replaces the result ids', () => {
    useUIStore.getState().setSearchResults(['a', 'b', 'c'])
    expect(useUIStore.getState().searchResults).toEqual(['a', 'b', 'c'])
    useUIStore.getState().setSearchResults([])
    expect(useUIStore.getState().searchResults).toEqual([])
  })

  it('clearSearch resets term, active, and results', () => {
    useUIStore.setState({
      searchTerm: 'foo',
      searchActive: true,
      searchResults: ['x'],
    })
    useUIStore.getState().clearSearch()
    const s = useUIStore.getState()
    expect(s.searchTerm).toBe('')
    expect(s.searchActive).toBe(false)
    expect(s.searchResults).toEqual([])
  })
})

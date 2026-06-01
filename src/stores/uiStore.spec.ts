import { describe, it, expect, beforeEach } from 'vitest'
import { useUIStore } from './uiStore'

describe('useUIStore searchToggled', () => {
  beforeEach(() => {
    useUIStore.setState({
      searchToggled: false,
      searchResults: [],
      searchTerm: '',
      searchActive: false,
    })
  })

  it('toggleSearch flips searchToggled', () => {
    expect(useUIStore.getState().searchToggled).toBe(false)
    useUIStore.getState().toggleSearch()
    expect(useUIStore.getState().searchToggled).toBe(true)
    useUIStore.getState().toggleSearch()
    expect(useUIStore.getState().searchToggled).toBe(false)
  })

  it('toggleSearchOff forces searchToggled false', () => {
    useUIStore.setState({ searchToggled: true })
    useUIStore.getState().toggleSearchOff()
    expect(useUIStore.getState().searchToggled).toBe(false)
    // Idempotent
    useUIStore.getState().toggleSearchOff()
    expect(useUIStore.getState().searchToggled).toBe(false)
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

/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, act, cleanup } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Topbar from './Topbar'
import * as types from '../../constants/ActionTypes'
import { State as AppState } from '../../reducers/app'
import { State as PeersState } from '../../reducers/peers'

// We only mock I18n since it's an external dependency
vi.mock('react-redux-i18n', () => ({
  I18n: {
    t: (key: string) => key === 'placeholder.search' ? 'Search...' : key
  },
  Translate: ({ value }: { value: string }) => value
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

// Mock clipboard API
const mockClipboard = {
  writeText: vi.fn()
}

Object.defineProperty(navigator, 'clipboard', {
  value: mockClipboard,
  writable: true
})

// Mock window.location
const locationMock = {
  origin: 'http://localhost:3000'
} as Location

Object.defineProperty(window, 'location', {
  value: locationMock,
  writable: true
})

vi.useFakeTimers()

describe('Topbar', () => {
  const mockDispatch = vi.fn()
  const defaultProps = {
    title: 'Test Title',
    loading: false,
    showInCenter: false,
    error: '',
    searchTerm: '',
    searchToggled: true,
    dispatch: mockDispatch,
    app: {
      backgroundImage: '',
      sidebarToggled: false,
      showAddMediaModal: false,
      mqlMatch: false,
      heightMqlMatch: false,
      loading: false,
      displayMiniQueue: true,
      showSpectrum: false,
      showVisuals: false,
      rightPanelToggled: false,
      ready: false,
    } satisfies AppState,
    peers: {
      peers: {}
    } satisfies PeersState
  }

  beforeEach(() => {
    mockDispatch.mockClear()
    vi.clearAllTimers()
    mockClipboard.writeText.mockClear()

    // Add modal container
    const modalRoot = document.createElement('div')
    modalRoot.setAttribute('id', 'modal')
    document.body.appendChild(modalRoot)
  })

  afterEach(() => {
    vi.clearAllMocks()
    cleanup()

    // Clean up modal container
    const modalRoot = document.getElementById('modal')
    if (modalRoot) {
      document.body.removeChild(modalRoot)
    }
  })

  const renderTopbar = (props = {}) => {
    return render(
      <BrowserRouter>
        <Topbar {...defaultProps} {...props} />
      </BrowserRouter>
    )
  }

  describe('Share room button', () => {
    it('should dispatch TOGGLE_RIGHT_PANEL when share button is clicked', () => {
      const { getByTitle } = renderTopbar()
      
      // Click share button
      const shareButton = getByTitle('Share room')
      fireEvent.click(shareButton)

      // Should dispatch TOGGLE_RIGHT_PANEL action
      expect(mockDispatch).toHaveBeenCalledWith({
        type: types.TOGGLE_RIGHT_PANEL
      })
    })
  })

  describe('Search functionality', () => {
    it('should update search term immediately but debounce the search action', async () => {
      const { getByTestId } = renderTopbar({ searchToggled: true })
      const input = getByTestId('search-input')

      // Type in search
      fireEvent.change(input, { target: { value: 'test' } })

      // Should have dispatched SET_SEARCH_TERM immediately
      expect(mockDispatch).toHaveBeenCalledWith({
        type: types.SET_SEARCH_TERM,
        searchTerm: 'test'
      })

      // Wait for debounce
      await act(async () => {
        vi.advanceTimersByTime(800)
      })

      // Now should have dispatched START_SEARCH
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: types.START_SEARCH,
          searchTerm: 'test'
        })
      )
    })

    it('should cancel previous search timeout when typing quickly', async () => {
      const { getByTestId } = renderTopbar({ searchToggled: true })
      const input = getByTestId('search-input')

      // Type 'test'
      fireEvent.change(input, { target: { value: 'test' } })

      // Should have dispatched SET_SEARCH_TERM immediately
      expect(mockDispatch).toHaveBeenCalledWith({
        type: types.SET_SEARCH_TERM,
        searchTerm: 'test'
      })

      // Type 'testing' before debounce timeout
      fireEvent.change(input, { target: { value: 'testing' } })

      // Should have dispatched SET_SEARCH_TERM immediately
      expect(mockDispatch).toHaveBeenCalledWith({
        type: types.SET_SEARCH_TERM,
        searchTerm: 'testing'
      })

      // Wait for debounce
      await act(async () => {
        vi.advanceTimersByTime(800)
      })

      // Should only have searched for "testing"
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: types.START_SEARCH,
          searchTerm: 'testing'
        })
      )
    })

    it('should not trigger search for terms less than 3 characters', async () => {
      const { getByTestId } = renderTopbar({ searchToggled: true })
      const input = getByTestId('search-input')

      // Type "te" (2 characters)
      fireEvent.change(input, { target: { value: 'te' } })

      // Fast forward timers
      await act(async () => {
        vi.advanceTimersByTime(800)
      })

      // Should have updated search term but not triggered search
      expect(mockDispatch).toHaveBeenCalledWith({
        type: types.SET_SEARCH_TERM,
        searchTerm: 'te'
      })
      expect(mockDispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: types.START_SEARCH,
          searchTerm: 'te'
        })
      )
    })

    it('should clear timeout when search is closed', async () => {
      const { getByTestId } = renderTopbar({ searchToggled: true })
      const input = getByTestId('search-input')

      // Type "test"
      fireEvent.change(input, { target: { value: 'test' } })

      // Should dispatch SET_SEARCH_TERM
      expect(mockDispatch).toHaveBeenCalledWith({
        type: types.SET_SEARCH_TERM,
        searchTerm: 'test'
      })

      // Close search before timeout
      fireEvent.keyUp(input, { key: 'Escape' })

      // Fast forward timers
      await act(async () => {
        vi.advanceTimersByTime(800)
      })

      // Should not have triggered search
      expect(mockDispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: types.START_SEARCH,
          searchTerm: 'test'
        })
      )
      expect(mockDispatch).toHaveBeenCalledWith({
        type: types.TOGGLE_SEARCH_OFF
      })
    })
  })
}) 
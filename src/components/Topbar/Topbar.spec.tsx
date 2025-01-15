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
      const { container } = renderTopbar()
      const searchInput = container.querySelector('input[placeholder="Search..."]')
      expect(searchInput).toBeTruthy()

      // Type "test" in the search input
      fireEvent.change(searchInput!, { target: { value: 'test' } })

      // Should immediately dispatch SET_SEARCH_TERM
      expect(mockDispatch).toHaveBeenCalledWith({
        type: types.SET_SEARCH_TERM,
        searchTerm: 'test'
      })

      // Fast forward timers
      await act(async () => {
        vi.advanceTimersByTime(800)
      })

      // Now should have dispatched START_SEARCH
      expect(mockDispatch).toHaveBeenCalledWith({
        type: types.START_SEARCH,
        searchTerm: 'test'
      })
    })

    it('should cancel previous search timeout when typing quickly', async () => {
      const { container } = renderTopbar()
      const searchInput = container.querySelector('input[placeholder="Search..."]')
      expect(searchInput).toBeTruthy()

      // Type "test"
      fireEvent.change(searchInput!, { target: { value: 'test' } })

      // Should dispatch SET_SEARCH_TERM for "test"
      expect(mockDispatch).toHaveBeenCalledWith({
        type: types.SET_SEARCH_TERM,
        searchTerm: 'test'
      })

      // Fast forward 200ms
      await act(async () => {
        vi.advanceTimersByTime(200)
      })

      // Type "testing" before the timeout
      fireEvent.change(searchInput!, { target: { value: 'testing' } })

      // Should dispatch SET_SEARCH_TERM for "testing"
      expect(mockDispatch).toHaveBeenCalledWith({
        type: types.SET_SEARCH_TERM,
        searchTerm: 'testing'
      })

      // Fast forward remaining time
      await act(async () => {
        vi.advanceTimersByTime(800)
      })

      // Should only have searched for "testing", not "test"
      expect(mockDispatch).toHaveBeenCalledWith({
        type: types.START_SEARCH,
        searchTerm: 'testing'
      })
    })

    it('should not trigger search for terms less than 3 characters', async () => {
      const { container } = renderTopbar()
      const searchInput = container.querySelector('input[placeholder="Search..."]')
      expect(searchInput).toBeTruthy()

      // Type "te" (2 characters)
      fireEvent.change(searchInput!, { target: { value: 'te' } })

      // Fast forward timers
      await act(async () => {
        vi.advanceTimersByTime(800)
      })

      // Should have updated search term but not triggered search
      expect(mockDispatch).toHaveBeenCalledWith({
        type: types.SET_SEARCH_TERM,
        searchTerm: 'te'
      })
      expect(mockDispatch).not.toHaveBeenCalledWith({
        type: types.START_SEARCH,
        searchTerm: 'te'
      })
    })

    it('should clear timeout when search is closed', async () => {
      const { container } = renderTopbar()
      const searchInput = container.querySelector('input[placeholder="Search..."]')
      expect(searchInput).toBeTruthy()

      // Type "test"
      fireEvent.change(searchInput!, { target: { value: 'test' } })

      // Should dispatch SET_SEARCH_TERM
      expect(mockDispatch).toHaveBeenCalledWith({
        type: types.SET_SEARCH_TERM,
        searchTerm: 'test'
      })

      // Close search before timeout
      fireEvent.keyUp(searchInput!, { key: 'Escape' })

      // Fast forward timers
      await act(async () => {
        vi.advanceTimersByTime(800)
      })

      // Should not have triggered search
      expect(mockDispatch).not.toHaveBeenCalledWith({
        type: types.START_SEARCH,
        searchTerm: 'test'
      })
      expect(mockDispatch).toHaveBeenCalledWith({
        type: types.TOGGLE_SEARCH_OFF
      })
    })
  })
}) 
/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Topbar from './Topbar'
import * as types from '../../constants/ActionTypes'
import { State as AppState } from '../../reducers/app'

// Mock react-redux-i18n
vi.mock('react-redux-i18n', () => ({
  I18n: {
    t: (key: string) => key === 'placeholder.search' ? 'Search...' : key
  },
  Translate: ({ value }: { value: string }) => value
}))

// Mock Icon component
vi.mock('../common/Icon', () => ({
  default: ({ icon }: { icon: string }) => <span data-testid={icon}>{icon}</span>
}))

// Mock ShareRoomModal component
vi.mock('../ShareRoomModal', () => ({
  default: ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => 
    isOpen ? <div data-testid="share-room-modal"><button onClick={onClose}>Close</button></div> : null
}))

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
      roomId: undefined
    } satisfies AppState & { roomId?: string }
  }

  beforeEach(() => {
    mockDispatch.mockClear()
    vi.clearAllTimers()
  })

  afterEach(() => {
    vi.clearAllMocks()
    cleanup()
  })

  const renderTopbar = (props = {}) => {
    return render(
      <BrowserRouter>
        <Topbar {...defaultProps} {...props} />
      </BrowserRouter>
    )
  }

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

      // Should not have dispatched START_SEARCH yet
      expect(mockDispatch).not.toHaveBeenCalledWith({
        type: types.START_SEARCH,
        searchTerm: 'test'
      })

      // Fast forward timers
      await act(async () => {
        vi.advanceTimersByTime(500)
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

      // Fast forward 200ms
      await act(async () => {
        vi.advanceTimersByTime(200)
      })

      // Type "testing" before the timeout
      fireEvent.change(searchInput!, { target: { value: 'testing' } })

      // Fast forward remaining time
      await act(async () => {
        vi.advanceTimersByTime(500)
      })

      // Should only have searched for "testing", not "test"
      expect(mockDispatch).not.toHaveBeenCalledWith({
        type: types.START_SEARCH,
        searchTerm: 'test'
      })
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
        vi.advanceTimersByTime(500)
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

      // Close search before timeout
      fireEvent.keyUp(searchInput!, { key: 'Escape' })

      // Fast forward timers
      await act(async () => {
        vi.advanceTimersByTime(500)
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
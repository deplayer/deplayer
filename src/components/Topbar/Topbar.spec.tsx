/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, act, cleanup } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Topbar from './Topbar'
import * as types from '../../constants/ActionTypes'
import { useUIStore } from '../../stores/uiStore'

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
  }

  beforeEach(() => {
    mockDispatch.mockClear()
    vi.clearAllTimers()
    mockClipboard.writeText.mockClear()

    // Reset uiStore slices touched by Topbar tests
    useUIStore.setState({
      searchToggled: false,
      searchTerm: '',
      rightPanelToggled: false,
      sidebarToggled: false,
    })

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
    it('should toggle the right panel via uiStore when share button is clicked', () => {
      expect(useUIStore.getState().rightPanelToggled).toBe(false)
      const { getByTitle } = renderTopbar()

      // Click share button
      const shareButton = getByTitle('Share room')
      fireEvent.click(shareButton)

      expect(useUIStore.getState().rightPanelToggled).toBe(true)
    })
  })

  describe('Search functionality', () => {
    it('should update uiStore search term immediately but debounce the search action', async () => {
      const { getByTestId } = renderTopbar({ searchToggled: true })
      const input = getByTestId('search-input')

      // Type in search
      fireEvent.change(input, { target: { value: 'test' } })

      // uiStore should be updated immediately
      expect(useUIStore.getState().searchTerm).toBe('test')
      // Redux SET_SEARCH_TERM dispatch has been removed
      expect(mockDispatch).not.toHaveBeenCalled()

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
      expect(useUIStore.getState().searchTerm).toBe('test')

      // Type 'testing' before debounce timeout
      fireEvent.change(input, { target: { value: 'testing' } })
      expect(useUIStore.getState().searchTerm).toBe('testing')

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
      expect(mockDispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: types.START_SEARCH,
          searchTerm: 'test'
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

      // Should have updated uiStore term but not triggered START_SEARCH
      expect(useUIStore.getState().searchTerm).toBe('te')
      expect(mockDispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: types.START_SEARCH,
          searchTerm: 'te'
        })
      )
    })

    it('should clear timeout and toggle search off via uiStore when search is closed', async () => {
      useUIStore.setState({ searchToggled: true })
      const { getByTestId } = renderTopbar({ searchToggled: true })
      const input = getByTestId('search-input')

      // Type "test"
      fireEvent.change(input, { target: { value: 'test' } })
      expect(useUIStore.getState().searchTerm).toBe('test')

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
      expect(useUIStore.getState().searchToggled).toBe(false)
    })
  })
})
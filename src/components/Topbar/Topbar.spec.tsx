/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, act, cleanup } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Topbar from './Topbar'
import * as types from '../../constants/ActionTypes'
import { useUIStore } from '../../stores/uiStore'

const mockDispatch = vi.fn()

vi.mock('react-redux-i18n', () => ({
  I18n: {
    t: (key: string) => key === 'placeholder.search' ? 'Search...' : key
  },
  Translate: ({ value }: { value: string }) => value
}))

vi.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (fn: (s: unknown) => unknown) => fn({ search: { loading: false } }),
}))

vi.mock('../../stores/livestore/hooks', () => ({
  useQueue: () => null,
  useMediaById: () => null,
  useArtistById: () => null,
  useAlbumById: () => null,
}))

const mockClipboard = { writeText: vi.fn() }
Object.defineProperty(navigator, 'clipboard', { value: mockClipboard, writable: true })

const locationMock = { origin: 'http://localhost:3000' } as Location
Object.defineProperty(window, 'location', { value: locationMock, writable: true })

vi.useFakeTimers()

describe('Topbar', () => {
  beforeEach(() => {
    mockDispatch.mockClear()
    vi.clearAllTimers()
    mockClipboard.writeText.mockClear()

    useUIStore.setState({
      searchToggled: true,
      searchTerm: '',
      rightPanelToggled: false,
      sidebarToggled: false,
    })

    const modalRoot = document.createElement('div')
    modalRoot.setAttribute('id', 'modal')
    document.body.appendChild(modalRoot)
  })

  afterEach(() => {
    vi.clearAllMocks()
    cleanup()
    const modalRoot = document.getElementById('modal')
    if (modalRoot) document.body.removeChild(modalRoot)
  })

  const renderTopbar = () => render(<BrowserRouter><Topbar /></BrowserRouter>)

  describe('Share room button', () => {
    it('toggles the right panel via uiStore when share button is clicked', () => {
      expect(useUIStore.getState().rightPanelToggled).toBe(false)
      const { getByTitle } = renderTopbar()
      fireEvent.click(getByTitle('Share room'))
      expect(useUIStore.getState().rightPanelToggled).toBe(true)
    })
  })

  describe('Search functionality', () => {
    it('updates uiStore search term immediately and debounces the search action', async () => {
      const { getByTestId } = renderTopbar()
      const input = getByTestId('search-input')

      fireEvent.change(input, { target: { value: 'test' } })
      expect(useUIStore.getState().searchTerm).toBe('test')
      expect(mockDispatch).not.toHaveBeenCalled()

      await act(async () => { vi.advanceTimersByTime(800) })

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: types.START_SEARCH, searchTerm: 'test' })
      )
    })

    it('cancels previous search timeout when typing quickly', async () => {
      const { getByTestId } = renderTopbar()
      const input = getByTestId('search-input')

      fireEvent.change(input, { target: { value: 'test' } })
      await act(async () => { vi.advanceTimersByTime(400) })

      fireEvent.change(input, { target: { value: 'testing' } })
      await act(async () => { vi.advanceTimersByTime(800) })

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: types.START_SEARCH, searchTerm: 'testing' })
      )
      expect(mockDispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: types.START_SEARCH, searchTerm: 'test' })
      )
    })

    it('does not trigger search for terms less than 3 characters', async () => {
      const { getByTestId } = renderTopbar()
      const input = getByTestId('search-input')

      fireEvent.change(input, { target: { value: 'te' } })
      await act(async () => { vi.advanceTimersByTime(800) })

      expect(mockDispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: types.START_SEARCH, searchTerm: 'te' })
      )
    })

    it('clears the pending timeout and toggles search off via uiStore when Escape is pressed', async () => {
      useUIStore.setState({ searchToggled: true })
      const { getByTestId } = renderTopbar()
      const input = getByTestId('search-input')

      fireEvent.change(input, { target: { value: 'test' } })
      await act(async () => { vi.advanceTimersByTime(400) })

      fireEvent.keyUp(input, { key: 'Escape' })

      await act(async () => { vi.advanceTimersByTime(400) })

      expect(mockDispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: types.START_SEARCH, searchTerm: 'test' })
      )
      expect(useUIStore.getState().searchToggled).toBe(false)
    })
  })
})

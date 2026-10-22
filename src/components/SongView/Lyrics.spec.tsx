import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Lyrics from './Lyrics'
import * as types from '../../constants/ActionTypes'
import { useLyrics } from '../../stores/livestore/hooks'

vi.mock('../../stores/livestore/store', () => ({
  useAppStore: () => ({ commit: vi.fn() }),
}))

vi.mock('../../stores/livestore/hooks', () => ({
  useLyrics: vi.fn(() => [])
}))

const mockUseLyrics = vi.mocked(useLyrics)

describe('Lyrics', () => {
  const mockDispatch = vi.fn()
  const defaultProps = {
    onClose: vi.fn(),
    songId: '123',
    dispatch: mockDispatch,
    isOpen: true
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseLyrics.mockReturnValue([])
    const modalRoot = document.createElement('div')
    modalRoot.setAttribute('id', 'modal-root')
    document.body.appendChild(modalRoot)
  })

  afterEach(() => {
    cleanup()
    document.getElementById('modal-root')?.remove()
  })

  it('fetches lyrics when LiveStore has none', () => {
    render(<Lyrics {...defaultProps} />)

    expect(mockDispatch).toHaveBeenCalledWith({ type: types.FETCH_LYRICS, songId: '123' })
  })

  it('shows stored lyrics without fetching', () => {
    mockUseLyrics.mockReturnValue([
      { id: 'l1', mediaId: '123', lyricsText: 'Borrowed time, borrowed love', source: null, createdAt: 0, updatedAt: 0 }
    ])

    render(<Lyrics {...defaultProps} />)

    expect(screen.getByText('Borrowed time, borrowed love')).toBeInTheDocument()
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('does not fetch while closed', () => {
    render(<Lyrics {...defaultProps} isOpen={false} />)

    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('closes when playback moves to another song', () => {
    const onClose = vi.fn()
    render(<Lyrics {...defaultProps} onClose={onClose} currentPlayingSongId='456' />)

    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when the modal is closed', () => {
    const onClose = vi.fn()
    render(<Lyrics {...defaultProps} onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))

    expect(onClose).toHaveBeenCalled()
  })
})

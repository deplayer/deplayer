import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Lyrics from './Lyrics'
import * as types from '../../constants/ActionTypes'

// Mock the LiveStore hooks
vi.mock('../../stores/livestore/store', () => ({
  useAppStore: () => ({ commit: vi.fn() }),
}))

vi.mock('../../stores/livestore/hooks', () => ({
  useLyrics: vi.fn(() => [])
}))

describe('Lyrics', () => {
  const mockDispatch = vi.fn()
  const defaultProps = {
    onClose: vi.fn(),
    songId: '123',
    dispatch: mockDispatch,
    isOpen: true
  }

  beforeEach(() => {
    mockDispatch.mockClear()
    // Create a div for the modal portal
    const modalRoot = document.createElement('div')
    modalRoot.setAttribute('id', 'modal-root')
    document.body.appendChild(modalRoot)
  })

  afterEach(() => {
    // Clean up the modal portal div
    const modalRoot = document.getElementById('modal-root')
    if (modalRoot) {
      document.body.removeChild(modalRoot)
    }
  })

  it.todo('TODO: Update tests for LiveStore - lyrics now come from useLyrics() hook')
  
  it('should fetch lyrics when no lyrics exist in LiveStore', () => {
    render(<Lyrics {...defaultProps} />)
    
    expect(mockDispatch).toHaveBeenCalledWith({
      type: types.FETCH_LYRICS,
      songId: '123'
    })
  })

  it('should call onClose when modal is closed', () => {
    const onClose = vi.fn()
    render(<Lyrics {...defaultProps} onClose={onClose} />)
    
    const closeButton = screen.getByRole('button', { name: 'Close' })
    fireEvent.click(closeButton)
    
    expect(onClose).toHaveBeenCalled()
  })
}) 

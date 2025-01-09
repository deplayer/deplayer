import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Lyrics from '../Lyrics'
import * as types from '../../../constants/ActionTypes'

describe('Lyrics', () => {
  const mockDispatch = vi.fn()
  const defaultProps = {
    onClose: vi.fn(),
    lyrics: '',
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

  it('should fetch lyrics when lyrics prop is empty', () => {
    render(<Lyrics {...defaultProps} />)
    
    expect(mockDispatch).toHaveBeenCalledWith({
      type: types.FETCH_LYRICS,
      songId: '123'
    })
  })

  it('should not fetch lyrics when lyrics prop is not empty', () => {
    render(<Lyrics {...defaultProps} lyrics="Test lyrics" />)
    
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('should display lyrics when provided', () => {
    const lyrics = 'Test song lyrics'
    render(<Lyrics {...defaultProps} lyrics={lyrics} />)
    
    expect(screen.getByText(lyrics)).toBeInTheDocument()
  })

  it('should call onClose when modal is closed', () => {
    const onClose = vi.fn()
    render(<Lyrics {...defaultProps} onClose={onClose} />)
    
    const closeButton = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeButton)
    
    expect(onClose).toHaveBeenCalled()
  })
}) 
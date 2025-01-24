import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest'
import Cover from './Cover'
import Media from '../../entities/Media'
import Album from '../../entities/Album'
import Artist from '../../entities/Artist'

// Mock Image loading
const mockImage = {
  onload: vi.fn(),
  src: ''
}

vi.stubGlobal('Image', vi.fn(() => mockImage))

const mockSong = new Media({
  id: '1',
  title: 'Test Song',
  cover: {
    thumbnailUrl: 'test-cover-thumb.jpg',
    fullUrl: 'test-cover.jpg'
  },
  artist: new Artist({
    name: 'Test Artist',
    artistId: '1'
  }),
  album: new Album({
    id: '1',
    name: 'Test Album',
    artist: new Artist({
      name: 'Test Artist',
      artistId: '1'
    })
  }),
  artistName: 'Test Artist',
  type: 'audio',
  duration: 180,
  stream: {},
  genres: [],
  albumName: 'Test Album'
})

describe('Cover', () => {
  beforeEach(() => {
    mockImage.onload = vi.fn()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('should not render when slim prop is true', () => {
    const { container } = render(<Cover slim song={mockSong} />)
    expect(container.firstChild).toBeNull()
  })

  it('should render cover image when not slim', () => {
    const { container } = render(<Cover song={mockSong} />)
    expect(container.querySelector('[data-testid="cover-container"]')).toBeInTheDocument()
  })

  it('should show hover preview on mouse enter', async () => {
    const { container } = render(<Cover song={mockSong} />)
    const coverElement = container.querySelector('[data-testid="cover-container"]')
    expect(coverElement).toBeTruthy()
    
    if (coverElement) {
      // Simulate image load
      mockImage.onload()
      
      fireEvent.mouseEnter(coverElement)
      const preview = container.querySelector('[data-testid="hover-preview"]')
      expect(preview).toHaveClass('opacity-100 visible')
    }
  })

  it('should hide hover preview on mouse leave', () => {
    const { container } = render(<Cover song={mockSong} />)
    const coverElement = container.querySelector('[data-testid="cover-container"]')
    expect(coverElement).toBeTruthy()
    
    if (coverElement) {
      // Simulate image load
      mockImage.onload()
      
      // Show preview
      fireEvent.mouseEnter(coverElement)
      const preview = container.querySelector('[data-testid="hover-preview"]')
      expect(preview).toHaveClass('opacity-100 visible')
      
      // Hide preview
      fireEvent.mouseLeave(coverElement)
      expect(preview).toHaveClass('opacity-0 invisible')
    }
  })

  it('should open modal on click', () => {
    const { container } = render(<Cover song={mockSong} />)
    const coverElement = container.querySelector('[data-testid="cover-container"]')
    expect(coverElement).toBeTruthy()
    
    if (coverElement) {
      fireEvent.click(coverElement)
      expect(screen.getByText('Test Album')).toBeInTheDocument()
    }
  })

  it('should close modal when clicking close button', () => {
    render(<Cover song={mockSong} slim={false} />)

    // Open modal
    fireEvent.click(screen.getByTestId('cover-container'))
    expect(screen.getByText('Test Album')).toBeInTheDocument()
    
    // Close modal
    fireEvent.click(screen.getByRole('button', { name: '' }))
    expect(screen.queryByText('Test Album')).not.toBeInTheDocument()
  })
}) 
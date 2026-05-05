import { render, screen, fireEvent, cleanup, act } from '@testing-library/react'
import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest'
import Cover from './Cover'
import type { MediaRow } from '../../types/media'

// Mock Image loading
const mockImage = {
  onload: vi.fn(),
  src: ''
}

vi.stubGlobal('Image', vi.fn(() => mockImage))

const mockSong: MediaRow = {
  id: '1',
  title: 'Test Song',
  cover: {
    thumbnailUrl: 'test-cover-thumb.jpg',
    fullUrl: 'test-cover.jpg'
  },
  artistId: '1',
  albumId: '1',
  artistName: 'Test Artist',
  albumName: 'Test Album',
  type: 'audio',
  duration: 180,
  playCount: 0,
  track: null,
  discNumber: null,
  stream: {},
  genres: [],
  externalId: null,
  shareUrl: null,
  filePath: null,
  genresFlat: '',
  providersFlat: '',
}

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
      await act(async () => {
        mockImage.onload()
      })

      await act(async () => {
        fireEvent.mouseEnter(coverElement)
      })

      const preview = container.querySelector('[data-testid="hover-preview"]')
      expect(preview).toHaveClass('opacity-100 visible')
    }
  })

  it('should hide hover preview on mouse leave', async () => {
    const { container } = render(<Cover song={mockSong} />)
    const coverElement = container.querySelector('[data-testid="cover-container"]')
    expect(coverElement).toBeTruthy()

    if (coverElement) {
      await act(async () => {
        mockImage.onload()
      })

      await act(async () => {
        fireEvent.mouseEnter(coverElement)
      })

      const preview = container.querySelector('[data-testid="hover-preview"]')
      expect(preview).toHaveClass('opacity-100 visible')

      await act(async () => {
        fireEvent.mouseLeave(coverElement)
      })

      expect(preview).toHaveClass('opacity-0 invisible')
    }
  })

  it('should open modal on click', async () => {
    const { container } = render(<Cover song={mockSong} />)
    const coverElement = container.querySelector('[data-testid="cover-container"]')
    expect(coverElement).toBeTruthy()

    if (coverElement) {
      await act(async () => {
        fireEvent.click(coverElement)
      })
      expect(screen.getByText('Test Album')).toBeInTheDocument()
    }
  })

  it('should close modal when clicking close button', async () => {
    render(<Cover song={mockSong} slim={false} />)

    await act(async () => {
      fireEvent.click(screen.getByTestId('cover-container'))
    })
    expect(screen.getByText('Test Album')).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    })
    expect(screen.queryByText('Test Album')).not.toBeInTheDocument()
  })
})

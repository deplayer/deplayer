import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import MediaSlider from '.'
import type { MediaRow } from '../../types/media'

describe('MediaSlider', () => {
  const mockMedia: MediaRow = {
    id: 'song-1',
    title: 'Test Song',
    artistId: 'artist-1',
    albumId: 'album-1',
    artistName: 'Test Artist',
    albumName: 'Test Album',
    type: 'audio',
    duration: 0,
    playCount: 3,
    track: null,
    discNumber: null,
    cover: {
      thumbnailUrl: 'test-thumb.jpg',
      fullUrl: 'test-full.jpg'
    },
    stream: {},
    genres: [],
    externalId: null,
    shareUrl: null,
    filePath: null,
    genresFlat: '',
    providersFlat: '',
  }

  const defaultProps = {
    title: 'Test Slider',
    mediaItems: [mockMedia]
  }

  it('renders song links correctly', () => {
    render(
      <MemoryRouter>
        <MediaSlider {...defaultProps} />
      </MemoryRouter>
    )

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/song/song-1')
  })

  it('shows play count for songs', () => {
    render(
      <MemoryRouter>
        <MediaSlider {...defaultProps} />
      </MemoryRouter>
    )

    expect(screen.getByText('#3 times played')).toBeInTheDocument()
  })

  it('shows loading spinner when loading prop is true', () => {
    render(
      <MemoryRouter>
        <MediaSlider {...defaultProps} loading />
      </MemoryRouter>
    )

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('renders nothing when mediaItems is empty', () => {
    render(
      <MemoryRouter>
        <MediaSlider {...defaultProps} mediaItems={[]} />
      </MemoryRouter>
    )

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('renders song title and artist name', () => {
    render(
      <MemoryRouter>
        <MediaSlider {...defaultProps} />
      </MemoryRouter>
    )

    expect(screen.getByText('Test Song')).toBeInTheDocument()
    expect(screen.getByText('Test Artist')).toBeInTheDocument()
  })
}) 
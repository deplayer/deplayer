import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import MediaCover, { AlbumCover } from '.'

describe('MediaCover', () => {
  const defaultProps = {
    id: 'test-id',
    name: 'Test Name',
    artistName: 'Test Artist',
    cover: {
      thumbnailUrl: 'test-thumb.jpg',
      fullUrl: 'test-full.jpg'
    }
  }

  it('renders album link when type is album', () => {
    render(
      <MemoryRouter>
        <MediaCover {...defaultProps} type="album" />
      </MemoryRouter>
    )

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/album/test-id')
  })

  it('renders song link when type is song', () => {
    render(
      <MemoryRouter>
        <MediaCover {...defaultProps} type="song" />
      </MemoryRouter>
    )

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/song/test-id')
  })

  it('renders album link by default when no type is specified', () => {
    render(
      <MemoryRouter>
        <MediaCover {...defaultProps} />
      </MemoryRouter>
    )

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/album/test-id')
  })

  it('renders play count when showPlayCount is true', () => {
    render(
      <MemoryRouter>
        <MediaCover {...defaultProps} showPlayCount playCount={5} />
      </MemoryRouter>
    )

    expect(screen.getByText('#5 times played')).toBeInTheDocument()
  })

  it('shows "never played" when playCount is 0 or undefined', () => {
    render(
      <MemoryRouter>
        <MediaCover {...defaultProps} showPlayCount />
      </MemoryRouter>
    )

    expect(screen.getByText('never played')).toBeInTheDocument()
  })

  it('renders artist name when provided', () => {
    render(
      <MemoryRouter>
        <MediaCover {...defaultProps} />
      </MemoryRouter>
    )

    expect(screen.getByText('Test Artist')).toBeInTheDocument()
  })

  describe('AlbumCover', () => {
    it('always renders with album type', () => {
      render(
        <MemoryRouter>
          <AlbumCover {...defaultProps} type="song" /> {/* Even if we pass song type */}
        </MemoryRouter>
      )
  
      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', '/album/test-id')
    })
  })
}) 
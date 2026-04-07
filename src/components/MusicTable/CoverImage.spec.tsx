import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import CoverImage from './CoverImage'

vi.mock('../../hooks/useCoverImage', () => ({
  useCoverImage: vi.fn().mockReturnValue(undefined),
}))

describe('CoverImage', () => {
  it('should render without errors', () => {
    render(
      <CoverImage
        cover={{ fullUrl: '', thumbnailUrl: '' }}
        size="thumbnail"
        albumName="My album"
      />
    )
    expect(screen.getByTestId('cover-image')).toBeTruthy()
  })

  it('should show placeholder when no cover provided', () => {
    render(<CoverImage albumName="No cover" />)
    const el = screen.getByTestId('cover-image')
    expect(el.style.backgroundImage).toContain('disc.svg')
  })
})

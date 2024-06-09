import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import Media from '../../entities/Media'
import CoverImage from './CoverImage'

const setup = () => {
  const props = {
    song: new Media(),
    size: 'thumbnail',
    albumName: 'My album',
    cover: {
      fullUrl: '',
      thumbnailUrl: '',
    },
    isCurrent: false
  }

  render(<CoverImage {...props} />)
}

describe('CoverImage', () => {
  it('should show render without errors', () => {
    setup()
    expect(screen.getByTestId('cover-image')).toBeTruthy()
  })
})

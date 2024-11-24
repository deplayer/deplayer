import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { BrowserRouter } from 'react-router-dom'

import Media from '../../../entities/Media'
import SongRow from './index'
import type { Props } from './index'
import { mediaParams } from '../../../entities/Media.spec'

const setup = () => {
  const props: Props = {
    dispatch: (_action: any) => _action,
    song: new Media(mediaParams),
    songsLength: 1,
    queue: {
      trackIds: [],
      randomTrackIds: [],
      currentPlaying: null,
      repeat: false,
      shuffle: false,
      nextSongId: null,
      prevSongId: null,
    },
    onClick: () => { },
    isCurrent: false,
    style: {},
    disableAddButton: false,
  }

  render(<SongRow {...props} />, { wrapper: BrowserRouter })
}

describe('SongRow', () => {
  it('should show render without errors', () => {
    setup()

    expect(screen.getByRole('row')).toBeTruthy()
  })
})

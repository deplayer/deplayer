import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { BrowserRouter as Router } from 'react-router-dom'
import Media from '../../../entities/Media'
import Artist from '../../../entities/Artist'
import Album from '../../../entities/Album'
import SongRow from './index'
import type { Props } from './index'
import { mediaParams } from '../../../entities/Media.spec'

const setup = () => {
  const props: Props = {
    dispatch: (_action: any) => _action,
    song: new Media({
      id: 'artist-name-album-name-undefined-title',
      title: 'title',
      cover: { thumbnailUrl: 'thumbnail', fullUrl: '' },
      artist: new Artist({
        id: '1',
        name: 'artistName'
      }),
      album: new Album({
        id: 'foo',
        name: 'album',
        artist: new Artist({
          id: 'foo',
          name: 'foo'
        }),
        thumbnailUrl: 'thumbnail'
      }),
      artistName: 'artistName',
      type: 'audio',
      duration: 100,
      stream: {},
      genres: []
    }),
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

  render(<Router><SongRow {...props} /></Router>)
}

describe('SongRow', () => {
  it('should show render without errors', () => {
    setup()
    expect(screen.getByTestId('song-row')).toBeTruthy()
  })
})

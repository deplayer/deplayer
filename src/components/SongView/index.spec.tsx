import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import SongView from './index'
import Media from '../../entities/Media'
import { defaultState as collectionDefaultState } from '../../reducers/collection'
import { BrowserRouter } from 'react-router-dom'

import { mediaParams } from '../../entities/Media.spec'

const setup = (customProps: any) => {
  const defaultProps = {
    song: new Media(mediaParams),
    match: {
      params: {}
    },
    collection: collectionDefaultState,
    settings: {
      settings: {
        app: {
          ipfs: {}
        }
      }
    },
    queue: {
      currentPlaying: null,
      trackIds: []
    }
  }

  return { ...defaultProps, ...customProps }
}

describe('SongView', () => {
  it('spinner if app loading', () => {
    const props = setup({ loading: true })

    render(<SongView {...props} />)
    expect(screen.getByTestId('spinner')).toBeTruthy()
  })

  it('render song without crash', () => {
    const song = new Media({ ...mediaParams, artistName: "Pink Floyd" })
    const rows = { [song.id]: song }
    const collection = { rows: rows, songsByGenre: [] }
    const props = setup({
      song,
      songId: song.id,
      collection,
      match: {
        params: {
          id: song.id
        }
      }
    })

    render(<SongView {...props} />, { wrapper: BrowserRouter })
    expect(screen.getByTestId('song-view')).toBeTruthy()
  })
})

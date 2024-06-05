import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import SongView from './index'
import Media from '../../entities/Media'
import { defaultState as collectionDefaultState } from '../../reducers/collection'

const setup = (customProps: any) => {
  const defaultProps = {
    song: new Media(),
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
  const props = setup({})
  render(<SongView {...props} />)

  it('spinner if app loading', () => {
    expect(screen.getByRole('spinner')).toBeTruthy()
  })

  it('render song without crash', () => {
    const song = new Media()
    const collection = { rows: {}, songsByGenre: [] }
    collection.rows[song.id] = song
    setup({
      song,
      collection,
      match: {
        params: {
          id: song.id
        }
      }
    })
    expect(screen.getByRole('.song-view')).toBeFalsy()
  })
})

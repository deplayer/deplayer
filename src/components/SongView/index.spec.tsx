import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, beforeAll, vi } from 'vitest'
import SongView from './index'
import Media from '../../entities/Media'
import { defaultState as collectionDefaultState } from '../../reducers/collection'
import { BrowserRouter } from 'react-router-dom'
import { mediaParams } from '../../entities/Media.spec'

// Mock IntersectionObserver
beforeAll(() => {
  const mockIntersectionObserver = vi.fn()
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null
  })
  window.IntersectionObserver = mockIntersectionObserver
})

const setup = (customProps: any) => {
  const defaultProps = {
    song: new Media({
      ...mediaParams,
      stream: {
        subsonic: {
          service: 'subsonic',
          uris: [{ uri: 'http://example.com/stream' }]
        }
      }
    }),
    match: {
      params: {}
    },
    collection: {
      ...collectionDefaultState,
      rows: {
        [mediaParams.id as string]: {
          ...mediaParams,
          stream: {
            subsonic: {
              service: 'subsonic',
              uris: [{ uri: 'http://example.com/stream' }]
            }
          }
        }
      }
    },
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
  it('spinner if app loading', async () => {
    const props = setup({ loading: true })

    await act(async () => {
      render(<BrowserRouter><SongView {...props} /></BrowserRouter>)
    })
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

import { describe, it, expect, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import MusicTable from './MusicTable'
import { renderWithProviders } from '../../test-utils/render'
import { createTestMediaList } from '../../test-utils/factories'
import { createDefaultState } from '../../test-utils/store'

// Mock react-virtualized's AutoSizer
vi.mock('react-virtualized', async () => {
  const actual = await vi.importActual('react-virtualized')
  return {
    ...actual,
    AutoSizer: ({ children }: { children: ({ width, height }: { width: number, height: number }) => React.ReactNode }) => 
      children({ width: 1000, height: 600 })
  }
})

describe('MusicTable', () => {
  const setup = (customProps = {}) => {
    const defaultState = createDefaultState()
    const mediaList = createTestMediaList(2)
    const defaultProps = {
      tableIds: ['song1', 'song2'],
      error: '',
      dispatch: vi.fn(),
      queue: defaultState.queue,
      app: {
        ready: true,
        backgroundImage: '',
        loading: false,
        sidebarToggled: false,
        showVisuals: false,
        showSpectrum: false,
        mqlMatch: false,
        heightMqlMatch: false,
        displayMiniQueue: false,
        showAddMediaModal: false,
        rightPanelToggled: false
      },
      collection: {
        ...defaultState.collection,
        rows: {
          song1: mediaList[0],
          song2: mediaList[1]
        }
      }
    }

    const props = { ...defaultProps, ...customProps }
    const initialState = {
      collection: props.collection
    }

    return {
      ...renderWithProviders(<MusicTable {...props} />, { initialState }),
      props,
      mediaList
    }
  }

  it('renders a table with songs', async () => {
    const { mediaList } = setup()
    
    // Since we're using react-virtualized, we need to check for grid
    const grid = screen.getByRole('grid')
    expect(grid).toBeInTheDocument()
    
    // Get all song rows
    const rows = screen.getAllByTestId('song-row')
    expect(rows).toHaveLength(mediaList.length)

    // Check each row has the correct content
    rows.forEach((row, index) => {
      const media = mediaList[index]
      expect(within(row).getByText(media.title)).toBeInTheDocument()
      expect(within(row).getByText(media.artist.name)).toBeInTheDocument()
      expect(within(row).getByText(media.album.name)).toBeInTheDocument()
    })
  })

  it('displays error message when provided', () => {
    setup({ error: 'Test error message' })
    expect(screen.getByText('Test error message')).toBeInTheDocument()
  })

  it('handles empty table gracefully', () => {
    setup({ tableIds: [] })
    const grid = screen.getByRole('grid')
    expect(grid).toBeInTheDocument()
    expect(within(grid).queryByRole('row')).not.toBeInTheDocument()
  })
})

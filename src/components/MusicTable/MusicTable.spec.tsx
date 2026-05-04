import { describe, it, expect, vi, afterEach } from 'vitest'
import { screen, within, cleanup, waitFor } from '@testing-library/react'
import MusicTable from './MusicTable'
import { renderWithProviders } from '../../test-utils/render'
import { createTestMediaList } from '../../test-utils/factories'
import { createDefaultState } from '../../test-utils/store'

// Mock LiveStore hooks since tests provide data via props
vi.mock('../../stores/livestore/store', () => ({
  useAppStore: () => ({ commit: vi.fn() }),
}))

vi.mock('../../stores/livestore/hooks', () => ({
  useMediaById: vi.fn(() => null),
  useQueue: vi.fn(() => null),
  useCurrentPlayingSongId: vi.fn(() => null),
  useIsFavorite: vi.fn(() => false),
  useFavoriteIds: vi.fn(() => new Set()),
}))

vi.mock('../../stores/livestore/actions', () => ({
  toggleFavoriteAction: vi.fn(),
  addToQueueAction: vi.fn(),
  removeFromQueueAction: vi.fn(),
  playAllAction: vi.fn(),
}))

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
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  const setup = (customProps = {}) => {
    const defaultState = createDefaultState()
    const mediaList = createTestMediaList(2)
    
    // Create mediaMap from test media
    const mediaMap = {
      'song1': mediaList[0],
      'song2': mediaList[1]
    }
    
    // Create mock queue
    const mockQueue = {
      id: 'default',
      trackIds: ['song1', 'song2'],
      currentPlaying: null,
      shuffle: false,
      repeat: 'off',
      randomTrackIds: []
    }
    
    const defaultProps = {
      tableIds: ['song1', 'song2'],
      mediaMap: mediaMap,
      queue: mockQueue,
      error: '',
      dispatch: vi.fn(),
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
      mediaList,
      mediaMap,
      mockQueue
    }
  }

  it('renders a table with songs', async () => {
    const { mediaList } = setup()
    
    // Wait for LiveStore to initialize and component to render
    await waitFor(() => {
      expect(screen.queryByText(/LiveStore is loading/)).not.toBeInTheDocument()
    })
    
    // Since we're using react-virtualized, we need to check for grid
    const grid = screen.getByRole('grid')
    expect(grid).toBeInTheDocument()
    
    // Get all song rows
    const rows = screen.getAllByTestId('song-row')
    expect(rows).toHaveLength(mediaList.length)

    // Check each row has the correct content
    rows.forEach((row, index) => {
      const media = mediaList[index]
      const withinRow = within(row)
      expect(withinRow.getByText(media.title)).toBeInTheDocument()
      expect(withinRow.getByText(media.artistName)).toBeInTheDocument()
      expect(withinRow.getByText(media.albumName)).toBeInTheDocument()
    })
  })

  it('displays error message when provided', async () => {
    setup({ error: 'Test error message' })
    
    // Wait for LiveStore to initialize
    await waitFor(() => {
      expect(screen.queryByText(/LiveStore is loading/)).not.toBeInTheDocument()
    })
    
    expect(screen.getByText('Test error message')).toBeInTheDocument()
  })

  it('handles empty table gracefully', async () => {
    setup({ tableIds: [] })
    
    // Wait for LiveStore to initialize
    await waitFor(() => {
      expect(screen.queryByText(/LiveStore is loading/)).not.toBeInTheDocument()
    })
    
    const grid = screen.getByRole('grid')
    expect(grid).toBeInTheDocument()
    expect(within(grid).queryByRole('row')).not.toBeInTheDocument()
  })
})

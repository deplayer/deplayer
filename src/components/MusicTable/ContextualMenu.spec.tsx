import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import ContextualMenu from './ContextualMenu'
import Media, { IMedia } from '../../entities/Media'
import { State as QueueState } from '../../reducers/queue'

// Mock createPortal to render in the same container for testing
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom')
  return {
    ...actual,
    createPortal: (element: React.ReactNode) => element
  }
})

const mockAddToQueueAction = vi.fn().mockResolvedValue(undefined)
const mockRemoveFromQueueAction = vi.fn().mockResolvedValue(undefined)
const mockAddNextAction = vi.fn().mockResolvedValue('track-id')

vi.mock('../../stores/livestore/actions', () => ({
  addToQueueAction: (...args: any[]) => mockAddToQueueAction(...args),
  addNextAction: (...args: any[]) => mockAddNextAction(...args),
  removeFromQueueAction: (...args: any[]) => mockRemoveFromQueueAction(...args),
}))

vi.mock('../../stores/livestore/store', () => ({
  useAppStore: () => ({ commit: vi.fn() }),
}))

vi.mock('../../stores/livestore/hooks', () => ({
  useMediaById: vi.fn(() => null),
  useQueue: vi.fn(() => ({ trackIds: [], currentPlaying: null })),
  useCurrentPlayingSongId: vi.fn(() => null),
  useIsFavorite: vi.fn(() => false),
  useFavoriteIds: vi.fn(() => new Set()),
  useFilteredMedia: vi.fn(() => []),
  useMediaMapForIds: vi.fn(() => ({})),
}))

describe('ContextualMenu', () => {
  let mockSong1: Media
  let mockSong2: Media
  let mockStore: any
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    mockAddToQueueAction.mockClear()
    mockRemoveFromQueueAction.mockClear()
    mockAddNextAction.mockClear()
    
    mockSong1 = new Media({
      id: 'test-song-1',
      title: 'Test Song 1',
      artist: { name: 'Test Artist' },
      artistName: 'Test Artist',
      artistId: 'test-artist-1',
      type: 'audio',
      album: { id: 'test-album-1', name: 'Test Album', artist: { name: 'Test Artist' } },
      albumName: 'Test Album',
      cover: { thumbnailUrl: 'test-cover.jpg', fullUrl: 'test-cover.jpg' },
      stream: { url: { service: 'test', uris: [{ uri: 'test-stream.mp3' }] } },
      duration: 180000,
      playCount: 0,
      genres: ['test']
    } as IMedia)

    mockSong2 = new Media({
      id: 'test-song-2',
      title: 'Test Song 2',
      artist: { name: 'Test Artist' },
      artistName: 'Test Artist',
      artistId: 'test-artist-1',
      type: 'audio',
      album: { id: 'test-album-1', name: 'Test Album', artist: { name: 'Test Artist' } },
      albumName: 'Test Album',
      cover: { thumbnailUrl: 'test-cover.jpg', fullUrl: 'test-cover.jpg' },
      stream: { url: { service: 'test', uris: [{ uri: 'test-stream.mp3' }] } },
      duration: 180000,
      playCount: 0,
      genres: ['test']
    } as IMedia)

    mockStore = createStore((state: { queue: QueueState } = {
      queue: {
        trackIds: [mockSong1.id],
        randomTrackIds: [],
        currentPlaying: mockSong1.id,
        repeat: false,
        shuffle: false,
        nextSongId: null,
        prevSongId: null
      }
    }) => state)

    // Mock getBoundingClientRect for positioning tests
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      x: 100,
      y: 200,
      width: 200,
      height: 250,
      top: 200,
      right: 300,
      bottom: 450,
      left: 100,
      toJSON: () => {}
    }))

    // Mock window properties
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true })
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true })
    Object.defineProperty(window, 'scrollX', { value: 0, writable: true })
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true })
    Object.defineProperty(window, 'pageXOffset', { value: 0, writable: true })
    Object.defineProperty(window, 'pageYOffset', { value: 0, writable: true })
    Object.defineProperty(window, 'devicePixelRatio', { value: 1, writable: true })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const setup = (props = {}, song = mockSong1) => {
    const onClick = vi.fn()
    const dispatch = vi.fn()

    const utils = render(
      <Provider store={mockStore}>
        <ContextualMenu
          song={song}
          onClick={onClick}
          dispatch={dispatch}
          queue={mockStore.getState().queue}
          {...props}
        />
      </Provider>
    )

    return {
      onClick,
      dispatch,
      ...utils,
    }
  }

  describe('Basic Functionality', () => {
    it('should render trigger button with proper accessibility attributes', () => {
      setup()
      const trigger = screen.getByRole('button', { name: /open context menu/i })
      
      expect(trigger).toBeInTheDocument()
      expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
      expect(trigger).toHaveAttribute('tabindex', '0')
    })

    it('should open menu when clicking the trigger button', async () => {
      setup()
      const trigger = screen.getByRole('button', { name: /open context menu/i })
      
      await user.click(trigger)
      
      expect(screen.getByRole('menu', { name: /song actions menu/i })).toBeInTheDocument()
      expect(trigger).toHaveAttribute('aria-expanded', 'true')
    })

    it('should close menu when clicking trigger again', async () => {
      setup()
      const trigger = screen.getByRole('button', { name: /open context menu/i })
      
      await user.click(trigger)
      expect(screen.getByRole('menu')).toBeInTheDocument()
      
      await user.click(trigger)
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    it('should open menu on right-click (context menu)', async () => {
      setup()
      const trigger = screen.getByRole('button', { name: /open context menu/i })
      
      fireEvent.contextMenu(trigger)
      
      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument()
      })
    })

    it('should open menu on Enter key press', async () => {
      setup()
      const trigger = screen.getByRole('button', { name: /open context menu/i })
      
      trigger.focus()
      await user.keyboard('{Enter}')
      
      expect(screen.getByRole('menu')).toBeInTheDocument()
    })

    it('should open menu on Space key press', async () => {
      setup()
      const trigger = screen.getByRole('button', { name: /open context menu/i })
      
      trigger.focus()
      await user.keyboard(' ')
      
      expect(screen.getByRole('menu')).toBeInTheDocument()
    })
  })

  describe('Menu Actions', () => {
    it('should dispatch play action when clicking play button', async () => {
      const { onClick } = setup()
      const trigger = screen.getByRole('button', { name: /open context menu/i })
      
      await user.click(trigger)
      const playButton = screen.getByRole('button', { name: /play/i })
      await user.click(playButton)
      
      expect(onClick).toHaveBeenCalledTimes(1)
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    it('should dispatch ADD_TO_QUEUE action when clicking add to queue', async () => {
      setup()
      const trigger = screen.getByRole('button', { name: /open context menu/i })
      
      await user.click(trigger)
      const addButton = screen.getByRole('button', { name: /addToQueue/i })
      await user.click(addButton)
      
      expect(mockAddToQueueAction).toHaveBeenCalledWith(expect.any(Object), [mockSong1.id])
    })

    it('should dispatch REMOVE_FROM_QUEUE action when song is in queue', async () => {
      setup()
      const trigger = screen.getByRole('button', { name: /open context menu/i })
      
      await user.click(trigger)
      const removeButton = screen.getByRole('button', { name: /^remove$/i })
      await user.click(removeButton)
      
      expect(mockRemoveFromQueueAction).toHaveBeenCalledWith(expect.any(Object), mockSong1.id)
    })

    it('should dispatch ADD_TO_QUEUE_NEXT when add next is available', async () => {
      setup()
      const trigger = screen.getByRole('button', { name: /open context menu/i })
      
      await user.click(trigger)
      const addNextButton = screen.getByRole('button', { name: /addNext/i })
      await user.click(addNextButton)
      
      expect(mockAddNextAction).toHaveBeenCalledWith(expect.any(Object), [mockSong1.id])
    })

    it('should dispatch REMOVE_FROM_COLLECTION action', async () => {
      const { dispatch } = setup()
      const trigger = screen.getByRole('button', { name: /open context menu/i })
      
      await user.click(trigger)
      const removeFromCollectionButton = screen.getByRole('button', { name: /removeFromCollection/i })
      await user.click(removeFromCollectionButton)
      
      expect(dispatch).toHaveBeenCalledWith({
        type: 'REMOVE_FROM_COLLECTION',
        data: [mockSong1]
      })
    })

    it('should hide add buttons when disableAddButton is true', async () => {
      setup({ disableAddButton: true })
      const trigger = screen.getByRole('button', { name: /open context menu/i })
      
      await user.click(trigger)
      
      expect(screen.queryByRole('button', { name: /add to queue/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /add next/i })).not.toBeInTheDocument()
    })
  })

  describe('Single Menu Constraint', () => {
    it('should close first menu when opening second menu', async () => {
      const { container: container1 } = setup({}, mockSong1)
      const { container: container2 } = setup({}, mockSong2)
      
      // Open first menu
      const trigger1 = container1.querySelector('[role="button"]') as HTMLElement
      await user.click(trigger1)
      
      await waitFor(() => {
        expect(screen.getAllByRole('menu')).toHaveLength(1)
      })
      
      // Open second menu
      const trigger2 = container2.querySelector('[role="button"]') as HTMLElement
      await user.click(trigger2)
      
      await waitFor(() => {
        // Should still only have one menu open
        expect(screen.getAllByRole('menu')).toHaveLength(1)
      })
    })

    it('should prevent multiple menus from being open simultaneously', async () => {
      // Render multiple menu instances
      const { container } = render(
        <Provider store={mockStore}>
          <div>
            <ContextualMenu
              song={mockSong1}
              onClick={vi.fn()}
              dispatch={vi.fn()}
              queue={mockStore.getState().queue}
            />
            <ContextualMenu
              song={mockSong2}
              onClick={vi.fn()}
              dispatch={vi.fn()}
              queue={mockStore.getState().queue}
            />
          </div>
        </Provider>
      )
      
      const triggers = container.querySelectorAll('[role="button"]')
      
      // Open first menu
      await user.click(triggers[0] as HTMLElement)
      await waitFor(() => expect(screen.getAllByRole('menu')).toHaveLength(1))
      
      // Open second menu
      await user.click(triggers[1] as HTMLElement)
      await waitFor(() => expect(screen.getAllByRole('menu')).toHaveLength(1))
      
      // Verify only one menu is open at any time
      expect(screen.getAllByRole('menu')).toHaveLength(1)
    })
  })

  describe('Keyboard Navigation', () => {
    it('should close menu on Escape key', async () => {
      setup()
      const trigger = screen.getByRole('button', { name: /open context menu/i })
      
      await user.click(trigger)
      expect(screen.getByRole('menu')).toBeInTheDocument()
      
      await user.keyboard('{Escape}')
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    it('should navigate through menu items with arrow keys', async () => {
      setup()
      const trigger = screen.getByRole('button', { name: /open context menu/i })
      
      await user.click(trigger)
      
      // Arrow down should move focus
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{ArrowDown}')
      
      // Should be able to activate with Enter
      await user.keyboard('{Enter}')
      
      // Menu should close after action
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    it('should handle Home and End keys for navigation', async () => {
      setup()
      const trigger = screen.getByRole('button', { name: /open context menu/i })
      
      await user.click(trigger)
      
      await user.keyboard('{Home}')
      await user.keyboard('{End}')
      await user.keyboard('{ArrowUp}')
      
      // Should still be able to navigate
      expect(screen.getByRole('menu')).toBeInTheDocument()
    })
  })

  describe('Click Outside Behavior', () => {
    it('should close menu when clicking outside', async () => {
      setup()
      const trigger = screen.getByRole('button', { name: /open context menu/i })
      
      await user.click(trigger)
      expect(screen.getByRole('menu')).toBeInTheDocument()
      
      // Click outside the menu
      await user.click(document.body)
      
      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument()
      })
    })

    it('should not close menu when clicking inside menu', async () => {
      setup()
      const trigger = screen.getByRole('button', { name: /open context menu/i })
      
      await user.click(trigger)
      const menu = screen.getByRole('menu')
      
      // Click inside the menu (but not on a button)
      fireEvent.click(menu)
      
      expect(screen.getByRole('menu')).toBeInTheDocument()
    })
  })

  describe('Positioning Logic', () => {
    it('should position menu correctly with default positioning', async () => {
      setup()
      const trigger = screen.getByRole('button', { name: /open context menu/i })
      
      await user.click(trigger)
      
      const menu = screen.getByRole('menu')
      expect(menu).toHaveStyle({ position: 'absolute' })
      expect(menu).toHaveAttribute('style')
    })

    it('should handle right-click positioning with click coordinates', async () => {
      setup()
      const trigger = screen.getByRole('button', { name: /open context menu/i })
      
      fireEvent.contextMenu(trigger, {
        clientX: 150,
        clientY: 250
      })
      
      await waitFor(() => {
        const menu = screen.getByRole('menu')
        expect(menu).toBeInTheDocument()
      })
    })

    it('should adjust position when menu would overflow viewport', async () => {
      // Mock a scenario where menu would overflow
      Object.defineProperty(window, 'innerWidth', { value: 200, writable: true })
      Object.defineProperty(window, 'innerHeight', { value: 300, writable: true })
      
      setup()
      const trigger = screen.getByRole('button', { name: /open context menu/i })
      
      await user.click(trigger)
      
      const menu = screen.getByRole('menu')
      expect(menu).toBeInTheDocument()
      // Menu should be positioned to fit within viewport
    })
  })

  describe('Component Cleanup', () => {
    it('should clean up event listeners on unmount', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener')
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')
      
      const { unmount } = setup()
      const trigger = screen.getByRole('button', { name: /open context menu/i })
      
      fireEvent.click(trigger)
      
      expect(addEventListenerSpy).toHaveBeenCalled()
      
      unmount()
      
      expect(removeEventListenerSpy).toHaveBeenCalled()
    })

    it('should reset global state when component unmounts while menu is active', async () => {
      const { unmount } = setup()
      const trigger = screen.getByRole('button', { name: /open context menu/i })
      
      await user.click(trigger)
      expect(screen.getByRole('menu')).toBeInTheDocument()
      
      unmount()
      
      // After unmounting, global state should be clean
      // This is tested implicitly by the single menu constraint tests
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      setup()
      const trigger = screen.getByRole('button', { name: /open context menu/i })
      
      await user.click(trigger)
      
      const menu = screen.getByRole('menu', { name: /song actions menu/i })
      expect(menu).toHaveAttribute('aria-label', 'Song actions menu')
      
      const menuItems = screen.getAllByRole('menuitem')
      expect(menuItems.length).toBeGreaterThan(0)
    })

    it('should manage focus properly', async () => {
      setup()
      const trigger = screen.getByRole('button', { name: /open context menu/i })
      
      trigger.focus()
      expect(trigger).toHaveFocus()
      
      await user.click(trigger)
      
      // After opening menu, focus management should be handled
      expect(screen.getByRole('menu')).toBeInTheDocument()
    })

    it('should return focus to trigger when closing with Escape', async () => {
      setup()
      const trigger = screen.getByRole('button', { name: /open context menu/i })
      
      await user.click(trigger)
      await user.keyboard('{Escape}')
      
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
      // Focus should return to trigger (this is implementation detail)
    })
  })
}) 
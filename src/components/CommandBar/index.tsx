import { Dispatch } from 'redux'
import { useState, useEffect, useMemo, useCallback, useRef, ReactNode } from 'react'
import { connect } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import Modal from '../common/Modal'
import Icon from '../common/Icon'
import Button from '../common/Button'
import { IconType } from '../common/Icon'
import { State as RootState } from '../../reducers'
import { State as CollectionState } from '../../reducers/collection'
import { startSearch, StartSearchAction } from '../../types/search'
import { THEMES } from '../Sidebar/ThemeModal'
import { I18n, Translate } from 'react-redux-i18n'
import * as types from '../../constants/ActionTypes'

interface BaseItem {
  id: string | number
  name: string | ReactNode
  icon?: IconType
  description?: string
  cover?: string
}

interface Command extends BaseItem {
  type: 'command'
  command: () => void
  category: string
  shortcut?: string
}

interface NavigationItem extends BaseItem {
  type: 'navigation'
  path: string
  category: 'sidebar' | 'section' | 'other'
}

interface ThemeItem extends BaseItem {
  type: 'theme'
  value: string
  category: 'theme'
}

interface PeerItem extends BaseItem {
  type: 'peer'
  status: 'online' | 'offline'
  lastSeen?: Date
}

interface MediaItem extends BaseItem {
  type: 'song' | 'artist' | 'album'
  artist?: string
  album?: string
}

type CommandBarItem = Command | NavigationItem | ThemeItem | PeerItem | MediaItem

interface GroupConfig {
  title: string
  icon: IconType
  priority: number
  filter?: (items: CommandBarItem[]) => CommandBarItem[]
}

interface GroupedItems {
  title: string
  items: CommandBarItem[]
  icon: IconType
}

interface Props {
  dispatch: Dispatch<StartSearchAction | { type: string; [key: string]: any }>
  searchResults: MediaItem[]
  loading: boolean
  collection: CollectionState
  togglePlaying: () => void
  playNext: () => void
  playPrev: () => void
  navigateToArtists: () => void
  navigateToAlbums: () => void
  navigateToQueue: () => void
  navigateToPlaylists: () => void
  navigateToSettings: () => void
  navigateToExplore: () => void
}

// Group configurations with priorities
const GROUP_CONFIGS: Record<string, GroupConfig> = {
  commands: {
    title: 'commandBar.categories.commands',
    icon: 'faSearch',
    priority: 1,
    filter: items => items.filter(item => item.type === 'command')
  },
  navigation: {
    title: 'commandBar.categories.navigation',
    icon: 'faStream',
    priority: 2,
    filter: items => items.filter(item => item.type === 'navigation')
  },
  themes: {
    title: 'commandBar.categories.themes',
    icon: 'faPalette',
    priority: 3,
    filter: items => items.filter(item => item.type === 'theme')
  },
  peers: {
    title: 'commandBar.categories.peers',
    icon: 'faUser',
    priority: 4,
    filter: items => items.filter(item => item.type === 'peer')
  },
  artists: {
    title: 'commandBar.categories.artists',
    icon: 'faMicrophoneAlt',
    priority: 5,
    filter: items => items.filter(item => item.type === 'artist')
  },
  albums: {
    title: 'commandBar.categories.albums',
    icon: 'faCompactDisc',
    priority: 6,
    filter: items => items.filter(item => item.type === 'album')
  },
  songs: {
    title: 'commandBar.categories.songs',
    icon: 'faMusic',
    priority: 7,
    filter: items => items.filter(item => item.type === 'song')
  }
}

type CommandItem = {
  id: string;
  type: 'command';
  name: string | ReactNode;
  shortcut?: string;
  command: () => void;
  category: string;
  icon: IconType;
}

function CommandBar({ dispatch, searchResults, loading, togglePlaying, playNext, playPrev }: Props) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const lastMediaSearch = useRef('')
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const resultsContainerRef = useRef<HTMLDivElement>(null)
  const selectedItemRef = useRef<HTMLButtonElement>(null)

  // Define available themes
  const themeItems: ThemeItem[] = THEMES.map(themeName => ({
    id: `theme-${themeName}`,
    type: 'theme',
    name: themeName.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    value: themeName,
    category: 'theme',
    description: `Switch to ${themeName} theme`
  }))

  // Define available commands
  const commands: CommandItem[] = [
    {
      id: 'toggle-playing',
      type: 'command',
      name: <Translate value="commandBar.commands.togglePlaying" />,
      shortcut: 'space',
      command: togglePlaying,
      category: 'commands',
      icon: 'faPlay'
    },
    {
      id: 'play-next',
      type: 'command',
      name: <Translate value="commandBar.commands.playNext" />,
      shortcut: '→, j',
      command: playNext,
      category: 'commands',
      icon: 'faStepForward'
    },
    {
      id: 'play-prev',
      type: 'command',
      name: <Translate value="commandBar.commands.playPrevious" />,
      shortcut: '←, k',
      command: playPrev,
      category: 'commands',
      icon: 'faStepBackward'
    },
    {
      id: 'toggle-shuffle',
      type: 'command',
      name: <Translate value="buttons.shuffle" />,
      command: () => dispatch({ type: types.SHUFFLE }),
      category: 'commands',
      icon: 'faRandom'
    },
    {
      id: 'toggle-repeat',
      type: 'command',
      name: <Translate value="buttons.repeat" />,
      command: () => dispatch({ type: types.REPEAT }),
      category: 'commands',
      icon: 'faRedo'
    }
  ]

  // Define navigation items
  const navigationItems: NavigationItem[] = [
    {
      id: 'nav-artists',
      type: 'navigation',
      name: <Translate value="menu.artists" />,
      icon: 'faMicrophoneAlt',
      category: 'sidebar',
      path: '/artists'
    },
    {
      id: 'nav-albums',
      type: 'navigation',
      name: <Translate value="menu.albums" />,
      icon: 'faCompactDisc',
      category: 'sidebar',
      path: '/albums'
    },
    {
      id: 'nav-queue',
      type: 'navigation',
      name: <Translate value="menu.queue" />,
      icon: 'faMusic',
      category: 'sidebar',
      path: '/queue'
    },
    {
      id: 'nav-playlists',
      type: 'navigation',
      name: <Translate value="menu.playlists" />,
      icon: 'faBookmark',
      category: 'sidebar',
      path: '/playlists'
    },
    {
      id: 'nav-settings',
      type: 'navigation',
      name: <Translate value="menu.settings" />,
      icon: 'faCogs',
      category: 'sidebar',
      path: '/settings'
    },
    {
      id: 'nav-explore',
      type: 'navigation',
      name: <Translate value="menu.home" />,
      icon: 'faGlobe',
      category: 'sidebar',
      path: '/explore'
    }
  ]

  const filterItems = useCallback((items: CommandBarItem[], searchTerm: string): CommandBarItem[] => {
    if (!searchTerm) return items
    const lowerSearch = searchTerm.toLowerCase()
    return items.filter(item => {
      const matches = [
        typeof item.name === 'string' ? item.name.toLowerCase().includes(lowerSearch) : false,
        item.description?.toLowerCase().includes(lowerSearch),
        'category' in item && item.category.toLowerCase().includes(lowerSearch),
        'artist' in item && item.artist?.toLowerCase().includes(lowerSearch),
        'album' in item && item.album?.toLowerCase().includes(lowerSearch)
      ]
      return matches.some(match => match)
    })
  }, [])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearch(value)
    setSelectedIndex(0)

    // Clear previous timer
    if (searchTimer.current) {
      clearTimeout(searchTimer.current)
      searchTimer.current = undefined
    }

    // Set new timer for debounced search
    if (value.length >= 3) {
      searchTimer.current = setTimeout(() => {
        const localItems = filterItems([...commands, ...navigationItems, ...themeItems], value)
        // Only dispatch search if we have no local matches and haven't searched for this term yet
        if (localItems.length === 0 && value !== lastMediaSearch.current) {
          lastMediaSearch.current = value
          dispatch(startSearch(value, 'all', true))
        }
        searchTimer.current = undefined
      }, 500)
    }
  }, [commands, navigationItems, themeItems, filterItems, dispatch])

  // Cleanup timer on unmount or when dependencies change
  useEffect(() => {
    return () => {
      if (searchTimer.current) {
        clearTimeout(searchTimer.current)
        searchTimer.current = undefined
      }
    }
  }, [])  // Remove dependencies to prevent unnecessary cleanup

  // Reset search state when modal closes
  useEffect(() => {
    if (!open) {
      setSearch('')
      setSelectedIndex(0)
      lastMediaSearch.current = ''
      if (searchTimer.current) {
        clearTimeout(searchTimer.current)
        searchTimer.current = undefined
      }
    }
  }, [open])

  const groupedItems = useMemo((): GroupedItems[] => {
    if (!search && searchResults.length === 0) {
      return []
    }

    // Combine all available items
    const allAvailableItems: CommandBarItem[] = [
      ...commands,
      ...navigationItems,
      ...themeItems,
      // Transform search results into CommandBarItems
      ...searchResults.map(result => ({
        id: result.id,
        type: result.type,
        name: result.name,
        artist: result.artist,
        album: result.album,
        description: `${result.artist} - ${result.album}`
      }))
    ]

    // Filter items based on search
    const filteredItems = filterItems(allAvailableItems, search)

    // Group items by type using the configuration
    return Object.entries(GROUP_CONFIGS)
      .map(([key, config]) => {
        const items = config.filter ? config.filter(filteredItems) : []
        return items.length > 0 ? {
          title: config.title,
          items,
          icon: config.icon,
          key
        } : null
      })
      .filter((group): group is (GroupedItems & { key: string }) => group !== null)
      .sort((a, b) => {
        const priorityA = GROUP_CONFIGS[a.key].priority
        const priorityB = GROUP_CONFIGS[b.key].priority
        return priorityA - priorityB
      })
  }, [search, commands, navigationItems, themeItems, searchResults, filterItems])

  const allItems = useMemo(() => 
    groupedItems.reduce<CommandBarItem[]>((acc, group) => [...acc, ...group.items], [])
  , [groupedItems])

  const handleClose = useCallback(() => {
    setOpen(false)
    setSearch('')
    setSelectedIndex(0)
  }, [])

  const handleItemSelect = useCallback((item: CommandBarItem) => {
    switch (item.type) {
      case 'command':
        item.command()
        break
      case 'navigation':
        navigate(item.path)
        break
      case 'theme':
        localStorage.setItem('theme', item.value)
        document.documentElement.setAttribute('data-theme', item.value)
        break
      case 'peer':
        // Handle peer selection
        break
      case 'song':
        navigate(`/song/${item.id}`)
        break
      case 'album':
        navigate(`/album/${item.id}`)
        break
      case 'artist':
        navigate(`/artist/${item.id}`)
        break
    }
    handleClose()
  }, [navigate, handleClose])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      setOpen(true)
      return
    }
    
    if (!open) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => prev < allItems.length - 1 ? prev + 1 : prev)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev)
        break
      case 'Enter':
        e.preventDefault()
        const selectedItem = allItems[selectedIndex]
        if (selectedItem) {
          handleItemSelect(selectedItem)
        }
        break
      case 'Escape':
        e.preventDefault()
        handleClose()
        break
    }
  }, [open, allItems, selectedIndex, handleItemSelect, handleClose])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const getIconForItem = useCallback((item: CommandBarItem): IconType => {
    if (item.icon) return item.icon

    switch (item.type) {
      case 'command':
        return 'faSearch'
      case 'navigation':
        return 'faStream'
      case 'theme':
        return 'faPalette'
      case 'peer':
        return item.status === 'online' ? 'faUser' : 'faUser'
      case 'artist':
        return 'faUser'
      case 'album':
        return 'faCompactDisc'
      case 'song':
        return 'faMusic'
      default:
        return 'faSearch'
    }
  }, [])

  // Add useEffect to handle scrolling when selectedIndex changes
  useEffect(() => {
    if (selectedItemRef.current && resultsContainerRef.current) {
      const container = resultsContainerRef.current
      const item = selectedItemRef.current
      
      const containerRect = container.getBoundingClientRect()
      const itemRect = item.getBoundingClientRect()

      if (itemRect.bottom > containerRect.bottom) {
        // Scroll down if item is below viewport
        item.scrollIntoView({ behavior: 'smooth', block: 'end' })
      } else if (itemRect.top < containerRect.top) {
        // Scroll up if item is above viewport
        item.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }, [selectedIndex])

  return (
    <div className='px-6 py-4 text-xs w-full flex justify-center items-center'>
      <Button
        transparent
        onClick={() => setOpen(true)}
        className="btn btn-ghost btn-sm"
        data-testid="search-button"
      >
        <Icon icon="faSearch" className="mr-2" />
        <span>Search...</span>
        <kbd className="ml-2 px-2 py-1 text-xs bg-base-200 rounded">⌘K</kbd>
      </Button>

      <Modal
        isOpen={open}
        onClose={handleClose}
        title={I18n.t('menu.search')}
        className="w-[800px] max-w-[90vw]"
      >
        <div className="flex flex-col">
          <div className="w-full flex bg-transparent border-b-4 border-accent items-center">
            <input
              type="text"
              autoFocus
              value={search}
              onChange={handleSearchChange}
              placeholder={I18n.t('menu.searchPlaceholder')}
              className="w-full p-4 bg-transparent text-2xl font-sans focus:outline-none focus:ring-0 focus:border-none action"
              data-testid="command-search-input"
            />
            <div className="p-2">
              {loading ? (
                <Icon icon="faSpinner" className="fa-pulse text-primary text-2xl" />
              ) : (
                <Icon icon="faSearch" className="text-primary text-2xl" />
              )}
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto w-full" ref={resultsContainerRef}>
            {loading && search.length > 1 && (
              <div className="p-6 text-center text-lg" data-testid="search-loading">{I18n.t('menu.searching')}</div>
            )}
            
            {!loading && allItems.length === 0 && search.length > 1 && (
              <div className="p-6 text-center text-lg" data-testid="search-no-results">{I18n.t('menu.noResults')}</div>
            )}

            {groupedItems.map((group, groupIndex) => (
              <div key={group.title} className="mb-4" data-testid={`search-group-${group.title.split('.').pop()}`}>
                <div className="px-4 py-2 text-sm font-semibold text-base-content/70 flex items-center">
                  <Icon icon={group.icon} className="mr-2" />
                  <Translate value={group.title} />
                </div>
                {group.items.map((item: CommandBarItem, index: number) => {
                  const itemIndex = groupedItems
                    .slice(0, groupIndex)
                    .reduce((acc, g) => acc + g.items.length, 0) + index

                  return (
                    <button
                      key={`${item.type}-${item.id}`}
                      ref={itemIndex === selectedIndex ? selectedItemRef : null}
                      className={`flex items-center p-4 w-full hover:bg-base-200 h-20 ${selectedIndex === itemIndex ? 'bg-base-200' : ''}`}
                      onClick={() => handleItemSelect(item)}
                    >
                      <div className="w-14 h-14 mr-4 flex-shrink-0 bg-base-300 rounded overflow-hidden flex items-center justify-center">
                        {item.cover ? (
                          <img 
                            src={item.cover} 
                            alt="" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Icon 
                            icon={getIconForItem(item)} 
                            className="text-primary text-2xl" 
                          />
                        )}
                      </div>
                      <div className="flex flex-col items-start justify-center min-w-0">
                        <span className="text-lg truncate w-full text-left">{item.name}</span>
                        <span className="text-sm opacity-60">
                          {'category' in item ? item.category : item.type}
                          {item.type === 'command' && item.shortcut && (
                            <kbd className="ml-2 px-2 py-0.5 text-xs bg-base-200 rounded">
                              {item.shortcut}
                            </kbd>
                          )}
                        </span>
                        {item.description && (
                          <span className="text-sm opacity-60 truncate w-full">
                            {item.description}
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>

          <div className="border-t border-base-300 mt-2 p-4 text-sm text-base-content/70 flex items-center justify-center space-x-8">
            <div className="flex items-center">
              <kbd className="px-2 py-1 bg-base-200 rounded mr-2">↑↓</kbd>
              <span>{I18n.t('menu.navigate')}</span>
            </div>
            <div className="flex items-center">
              <kbd className="px-2 py-1 bg-base-200 rounded mr-2">Enter</kbd>
              <span>{I18n.t('menu.select')}</span>
            </div>
            <div className="flex items-center">
              <kbd className="px-2 py-1 bg-base-200 rounded mr-2">Esc</kbd>
              <span>{I18n.t('menu.close')}</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default connect(
  (state: RootState) => ({
    searchResults: state.collection.searchResults.map(id => {
      const media = state.collection.rows[id];
      if (!media) return null;
      return {
        id,
        name: media.title,
        type: 'song' as const,
        cover: media.cover?.thumbnailUrl,
        artist: media.artist?.name,
        album: media.album?.name
      };
    }).filter(Boolean) as MediaItem[],
    loading: state.collection.loading,
    collection: state.collection
  }),
  (dispatch: Dispatch<StartSearchAction | { type: string; [key: string]: any }>) => ({
    dispatch,
    togglePlaying: () => dispatch({ type: 'TOGGLE_PLAYING' }),
    playNext: () => dispatch({ type: 'PLAY_NEXT' }),
    playPrev: () => dispatch({ type: 'PLAY_PREV' }),
  })
)(CommandBar)
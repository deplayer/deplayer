import { Dispatch } from 'redux'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { connect } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import Modal from '../common/Modal'
import Icon from '../common/Icon'
import Button from '../common/Button'
import { IconType } from '../common/Icon'
import { State as RootState } from '../../reducers'
import { State as CollectionState } from '../../reducers/collection'
import { startSearch, StartSearchAction } from '../../types/search'

interface Command {
  id: number
  name: string
  command: () => void
  icon?: IconType
  category?: string
}

interface SearchResult {
  id: string
  name: string
  type: 'artist' | 'album' | 'song'
  cover?: string
}

interface Props {
  dispatch: Dispatch<StartSearchAction | { type: string; [key: string]: any }>
  searchResults: SearchResult[]
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

function CommandBar({ dispatch, searchResults, loading, togglePlaying, playNext, playPrev }: Props) {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const commands: Command[] = [
    {
      id: 1,
      name: 'Play/Pause',
      icon: 'faPlayCircle',
      category: 'Playback',
      command: togglePlaying
    },
    {
      id: 2,
      name: 'Next Track',
      icon: 'faStepForward',
      category: 'Playback',
      command: playNext
    },
    {
      id: 3,
      name: 'Previous Track',
      icon: 'faStepBackward',
      category: 'Playback',
      command: playPrev
    },
    {
      id: 10,
      name: 'Toggle Visuals',
      icon: 'faBahai',
      category: 'Player',
      command: () => dispatch({ type: 'TOGGLE_VISUALS' })
    },
    {
      id: 11,
      name: 'Toggle Spectrum',
      icon: 'faDeezer',
      category: 'Player',
      command: () => dispatch({ type: 'TOGGLE_SPECTRUM' })
    },
    {
      id: 12,
      name: 'Shuffle Queue',
      icon: 'faRandom',
      category: 'Queue',
      command: () => dispatch({ type: 'SHUFFLE' })
    },
    {
      id: 13,
      name: 'Toggle Repeat',
      icon: 'faRedo',
      category: 'Queue',
      command: () => dispatch({ type: 'REPEAT' })
    },
    {
      id: 14,
      name: 'Add New Media',
      icon: 'faPlusCircle',
      category: 'Collection',
      command: () => {
        dispatch({ type: 'SHOW_ADD_MEDIA_MODAL' })
        handleClose()
      }
    },
    {
      id: 4,
      name: 'Artists',
      icon: 'faMicrophoneAlt',
      category: 'Navigation',
      command: () => {
        navigate('/artists')
        handleClose()
      }
    },
    {
      id: 5,
      name: 'Albums',
      icon: 'faCompactDisc',
      category: 'Navigation',
      command: () => {
        navigate('/albums')
        handleClose()
      }
    },
    {
      id: 6,
      name: 'Queue',
      icon: 'faMusic',
      category: 'Navigation',
      command: () => {
        navigate('/queue')
        handleClose()
      }
    },
    {
      id: 7,
      name: 'Playlists',
      icon: 'faBookmark',
      category: 'Navigation',
      command: () => {
        navigate('/playlists')
        handleClose()
      }
    },
    {
      id: 8,
      name: 'Settings',
      icon: 'faCogs',
      category: 'Navigation',
      command: () => {
        navigate('/settings')
        handleClose()
      }
    },
    {
      id: 9,
      name: 'Explore',
      icon: 'faGlobe',
      category: 'Navigation',
      command: () => {
        navigate('/explore')
        handleClose()
      }
    },
  ]

  // Update debounced value after 500ms of no changes and minimum length
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.length >= 3) {
        setDebouncedSearch(search)
      } else {
        setDebouncedSearch('')
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [search])

  // Trigger search only when debounced value changes and is not empty
  useEffect(() => {
    if (debouncedSearch) {
      dispatch(startSearch(debouncedSearch))
    }
  }, [debouncedSearch, dispatch])

  // Reset search state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearch('')
      setDebouncedSearch('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  const allItems = useMemo(() => [
    ...(!search ? commands : []),
    ...searchResults
  ], [search, commands, searchResults])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      setIsOpen(true)
    }
    if (!isOpen) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => 
        prev < allItems.length - 1 ? prev + 1 : prev
      )
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => prev > 0 ? prev - 1 : prev)
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      const selectedItem = allItems[selectedIndex]
      if (selectedItem) {
        if ('command' in selectedItem) {
          selectedItem.command()
        } else {
          // Navigate to the appropriate view based on result type
          switch (selectedItem.type) {
            case 'song':
              navigate(`/song/${selectedItem.id}`)
              break
            case 'album':
              navigate(`/album/${selectedItem.id}`)
              break
            case 'artist':
              navigate(`/artist/${selectedItem.id}`)
              break
          }
        }
        handleClose()
      }
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      handleClose()
    }
  }, [isOpen, allItems, selectedIndex, navigate])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    setSearch('')
    setSelectedIndex(0)
  }, [])

  const getIconForType = useCallback((type: string): IconType => {
    switch (type) {
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

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setSelectedIndex(0)
  }, [])

  return (
    <div className='px-6 py-4 text-xs w-full flex justify-center items-center'>
      <Button
        transparent
        onClick={() => setIsOpen(true)}
        className="btn btn-ghost btn-sm"
      >
        <Icon icon="faSearch" className="mr-2" />
        <span>Search...</span>
        <kbd className="ml-2 px-2 py-1 text-xs bg-base-200 rounded">⌘K</kbd>
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Search"
        className="w-[800px] max-w-[90vw]"
      >
        <div className="flex flex-col">
          <div className="w-full flex bg-transparent border-b-4 border-accent items-center">
            <input
              type="text"
              autoFocus
              value={search}
              onChange={handleSearchChange}
              placeholder="Search for artists, albums, songs, or commands..."
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

          <div className="max-h-[60vh] overflow-y-auto w-full">
            {loading && search.length > 1 && (
              <div className="p-6 text-center text-lg">Searching...</div>
            )}
            
            {!loading && allItems.length === 0 && search.length > 1 && (
              <div className="p-6 text-center text-lg">No results found</div>
            )}

            {allItems.slice(0, 500).map((item, index) => {
              const isCommand = 'command' in item
              return (
                <button
                  key={isCommand ? `command-${item.id}` : `result-${item.id}`}
                  className={`flex items-center p-4 w-full hover:bg-base-200 h-20 ${selectedIndex === index ? 'bg-base-200' : ''}`}
                  onClick={() => {
                    if (isCommand) {
                      item.command()
                    } else {
                      // Navigate to the appropriate view based on result type
                      switch (item.type) {
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
                    }
                    handleClose()
                  }}
                >
                  <div className="w-14 h-14 mr-4 flex-shrink-0 bg-base-300 rounded overflow-hidden flex items-center justify-center">
                    {isCommand ? (
                      <Icon 
                        icon={(item as Command).icon || 'faSearch'} 
                        className="text-primary text-2xl" 
                      />
                    ) : (
                      <>
                        {item.cover ? (
                          <img 
                            src={item.cover} 
                            alt="" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Icon 
                            icon={getIconForType((item as SearchResult).type)} 
                            className="text-primary text-2xl" 
                          />
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex flex-col items-start justify-center min-w-0">
                    <span className="text-lg truncate w-full">{isCommand ? item.name : item.name}</span>
                    <span className="text-sm opacity-60">
                      {isCommand ? item.category : (item as SearchResult).type}
                    </span>
                  </div>
                </button>
              )
            })}
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
        name: media.title || id,
        type: 'song',
        cover: media.cover?.thumbnailUrl
      };
    }).filter(Boolean) as SearchResult[],
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
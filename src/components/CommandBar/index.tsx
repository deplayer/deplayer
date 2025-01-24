import { Dispatch } from 'redux'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { connect } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import Modal from '../common/Modal'
import Icon from '../common/Icon'
import Button from '../common/Button'
import * as types from '../../constants/ActionTypes'
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
}

interface Props {
  dispatch: Dispatch<StartSearchAction | { type: string; [key: string]: any }>
  searchResults: SearchResult[]
  loading: boolean
  collection: CollectionState
}

function CommandBar({ dispatch, searchResults, loading, }: Props) {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const commands = useMemo(() => [
    {
      id: 1,
      name: "Add new media",
      icon: 'faPlusCircle',
      category: 'Actions',
      command() {
        return dispatch({ type: types.SHOW_ADD_MEDIA_MODAL })
      }
    },
    {
      id: 2,
      name: "Toggle visuals",
      icon: 'faBahai',
      category: 'Player',
      command() {
        return dispatch({ type: types.TOGGLE_VISUALS })
      }
    },
    {
      id: 3,
      name: "Toggle spectrum",
      icon: 'faDeezer',
      category: 'Player',
      command() {
        return dispatch({ type: types.TOGGLE_SPECTRUM })
      }
    }
  ], [dispatch])

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
      >
        <div className="flex flex-col">
          <div className="w-full flex bg-transparent border-b-4 border-accent items-center">
            <input
              type="text"
              autoFocus
              value={search}
              onChange={handleSearchChange}
              placeholder="Search for artists, albums, songs, or commands..."
              className="w-full p-3 bg-transparent text-xl font-sans focus:outline-none focus:ring-0 focus:border-none action"
              data-testid="command-search-input"
            />
            <div className="p-2">
              {loading ? (
                <Icon icon="faSpinner" className="fa-pulse text-primary" />
              ) : (
                <Icon icon="faSearch" className="text-primary" />
              )}
            </div>
          </div>

          <div className="max-h-[300px] overflow-y-auto">
            {loading && search.length > 1 && (
              <div className="p-4 text-center">Searching...</div>
            )}
            
            {!loading && allItems.length === 0 && search.length > 1 && (
              <div className="p-4 text-center">No results found</div>
            )}

            {allItems.map((item, index) => {
              const isCommand = 'command' in item
              return (
                <button
                  key={isCommand ? `command-${item.id}` : `result-${item.id}`}
                  className={`flex items-center p-2 ${selectedIndex === index ? 'bg-base-200' : ''}`}
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
                  <Icon 
                    icon={isCommand ? (item as Command).icon || 'faSearch' : getIconForType((item as SearchResult).type)} 
                    className="mr-2" 
                  />
                  {isCommand ? item.name : `${item.name} (${(item as SearchResult).type})`}
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
  (state: RootState) => {
    // Process each media item from search results
    const processedResults = new Set<string>();
    const searchResults: SearchResult[] = [];

    // Process each media item from search results
    state.collection.searchResults.forEach((id: string) => {
      const media = state.collection.rows[id];
      if (!media) return;

      // Add artist if not already added
      if (media.artist?.name && !processedResults.has(`artist-${media.artist.name}`)) {
        processedResults.add(`artist-${media.artist.name}`);
        searchResults.push({
          id: media.artist.id || id,
          name: media.artist.name,
          type: 'artist'
        });
      }

      // Add album if not already added
      if (media.album?.name && !processedResults.has(`album-${media.album.name}`)) {
        processedResults.add(`album-${media.album.name}`);
        searchResults.push({
          id: media.album.id || id,
          name: media.album.name,
          type: 'album'
        });
      }

      // Add song if not already added
      if (!processedResults.has(`song-${id}`)) {
        processedResults.add(`song-${id}`);
        searchResults.push({
          id,
          name: media.title || id,
          type: 'song'
        });
      }
    });

    return {
      searchResults,
      loading: state.collection.loading,
      collection: state.collection
    };
  },
  (dispatch: Dispatch<StartSearchAction | { type: string; [key: string]: any }>) => ({
    dispatch
  })
)(CommandBar)
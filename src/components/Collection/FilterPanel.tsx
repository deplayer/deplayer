import Select from 'react-select'
import { Filter } from '../../stores/uiStore'
import Button from '../common/Button'
import { Dispatch } from 'redux'
import Icon from '../common/Icon'
import Modal from '../common/Modal'
import { useState, useEffect } from 'react'
import { useUIStore } from '../../stores/uiStore'
import { useAppStore } from '../../stores/livestore/store'
import { createSmartPlaylistAction } from '../../stores/livestore/actions/smartPlaylists'
import { useArtists, useAvailableGenres, useAvailableProviders, useAvailableTypes } from '../../stores/livestore/hooks'

type Props = {
  dispatch?: Dispatch;
}

const FilterPanel = (_props: Props) => {
  const activeFilters = useUIStore(s => s.activeFilters)
  const setFilter = useUIStore(s => s.setFilter)
  const liveStore = useAppStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  
  // Get metadata from lightweight LiveStore hooks
  // These query only the necessary columns, not full media objects
  const artists = useArtists()
  const genres = useAvailableGenres()      // Returns string[] directly
  const types = useAvailableTypes()        // Returns string[] directly
  const providers = useAvailableProviders() // Returns string[] directly

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // Create artists map for quick lookup
  const artistsMap = artists.reduce((acc: Record<string, any>, artist: any) => {
    acc[artist.id] = artist
    return acc
  }, {})

  // Create grouped options
  const groupedOptions = [
    {
      label: 'Genres',
      options: genres.map(value => ({
        value: `genre:${value}`,
        label: value,
        color: '#ff9999' // Light red for genres
      }))
    },
    {
      label: 'Types',
      options: types.map(value => ({
        value: `type:${value}`,
        label: value,
        color: '#99ff99' // Light green for types
      }))
    },
    {
      label: 'Artists',
      options: artists.map((artist: any) => ({
        value: `artist:${artist.id}`,
        label: artist.name,
        color: '#9999ff' // Light blue for artists
      }))
    },
    {
      label: 'Providers',
      options: providers.map(value => ({
        value: `provider:${value}`,
        label: value,
        color: '#99ccff' // Light blue for providers
      }))
    }
  ]

  // Format currently selected values
  const selectedValues = [
    ...activeFilters.genres.map(g => ({ value: `genre:${g}`, label: g, color: '#ff9999' })),
    ...activeFilters.types.map(t => ({ value: `type:${t}`, label: t, color: '#99ff99' })),
    ...activeFilters.artists.map(a => ({
      value: `artist:${a}`,
      label: artistsMap[a]?.name || a,
      color: '#9999ff'
    })),
    ...activeFilters.providers.map(p => ({
      value: `provider:${p}`,
      label: p,
      color: '#99ccff'
    }))
  ]

  const customStyles = {
    control: (provided: any) => ({
      ...provided,
      backgroundColor: 'var(--select-bg)',
      borderColor: 'var(--select-border)',
      color: 'var(--select-text)',
      '&:hover': {
        borderColor: 'var(--select-border-hover)'
      }
    }),
    input: (provided: any) => ({
      ...provided,
      color: 'var(--select-text)',
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: 'var(--select-text)',
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: 'var(--select-text)',
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? state.data.color
        : state.isFocused
          ? `${state.data.color}80`
          : 'var(--select-option-bg)',
      color: state.isSelected
        ? 'white'
        : 'var(--select-text)',
      '&:hover': {
        backgroundColor: `${state.data.color}80`
      }
    }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: 'var(--select-menu-bg)',
      border: '1px solid var(--select-border)',
      backdropFilter: 'blur(8px)',
      zIndex: 9999,
      width: '100%',
      margin: '0',
    }),
    menuPortal: (provided: any) => ({
      ...provided,
      zIndex: 9999,
    }),
    menuList: (provided: any) => ({
      ...provided,
      backgroundColor: 'var(--select-menu-bg)',
      backdropFilter: 'blur(8px)',
      maxHeight: '30vh',
      padding: '0',
    }),
    multiValue: (provided: any, { data }: any) => ({
      ...provided,
      backgroundColor: `${data.color}40`,
      border: `1px solid ${data.color}`,
    }),
    multiValueLabel: (provided: any) => ({
      ...provided,
      color: 'var(--select-text)',
      fontSize: '0.85em',
      padding: '2px',
    }),
    multiValueRemove: (provided: any, { data }: any) => ({
      ...provided,
      color: data.color,
      ':hover': {
        backgroundColor: data.color,
        color: 'white',
      },
    }),
  }

  const handleSaveSmartPlaylist = async () => {
    if (!liveStore) return
    
    const name = window.prompt('Enter a name for this smart playlist:')
    if (!name) return
    
    try {
      await createSmartPlaylistAction(liveStore, name, {
        genres: activeFilters.genres,
        types: activeFilters.types,
        artists: activeFilters.artists,
        providers: activeFilters.providers
      })
    } catch (error) {
      console.error('Failed to save smart playlist:', error)
    }
  }

  const handleFilterChange = (filterType: keyof Filter, values: string[] | boolean) => {
    setFilter(filterType, values)
  }

  const hasActiveFilters = Object.entries(activeFilters).some(([key, value]) => {
    if (key === 'favorites') {
      return value === true;
    }
    return Array.isArray(value) && value.length > 0;
  });

  const filterContent = (
    <div className='flex w-full items-center'>
      <Select
        isMulti
        options={groupedOptions}
        value={selectedValues}
        placeholder='Filter by...'
        onChange={(selected) => {
          const selectedItems = selected || []
          const filterTypes = ['genre', 'type', 'artist', 'provider'] as const
          filterTypes.forEach(type => {
            const values = selectedItems
              .filter(item => item.value.startsWith(`${type}:`))
              .map(item => item.value.replace(`${type}:`, ''))
            handleFilterChange(`${type}s` as keyof Filter, values)
          })
        }}
        styles={customStyles}
        className="react-select-container flex-1"
        classNamePrefix="react-select"
        menuPortalTarget={document.body}
        menuPosition="fixed"
        menuPlacement="auto"
      />
      <Button
        size='xs'
        onClick={() => setFilter('favorites', !activeFilters.favorites)}
        className={`ml-2 ${activeFilters.favorites ? 'text-red-500' : 'text-base-content/70'}`}
        transparent
        title={activeFilters.favorites ? "Remove favorites filter" : "Show favorites only"}
      >
        <Icon icon="faHeart" className='px-1' />
      </Button>
      {hasActiveFilters && (
        <Button
          size='xs'
          onClick={handleSaveSmartPlaylist}
          disabled={!hasActiveFilters}
          inverted
          transparent
          title="Save as smart playlist"
          className='cursor-pointer ml-2'
        >
          <Icon icon="faSave" className='px-1' />
        </Button>
      )}
    </div>
  )

  if (isMobile) {
    return (
      <>
        <Button
          transparent
          onClick={() => setIsModalOpen(true)}
          className="md:hidden"
        >
          <Icon icon="faFilter" className='px-1' />
          {Object.values(activeFilters).some(arr => Array.isArray(arr) && arr.length > 0) && (
            <span className="ml-1 text-xs bg-blue-500 text-white rounded-full px-2">
              {Object.values(activeFilters).reduce((acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0), 0)}
            </span>
          )}
        </Button>
        {isModalOpen && (
          <Modal
            title="Filter Collection"
            onClose={() => setIsModalOpen(false)}
            isOpen={isModalOpen}
          >
            <div className="p-4 flex flex-col gap-4">
              <div className="relative w-full">
                {filterContent}
              </div>
            </div>
          </Modal>
        )}
      </>
    )
  }

  return (
    <div className="filter-panel hidden md:flex items-center w-full">
      {filterContent}
      <div className="vertical-divider border-l border-gray-500 mx-2" />
    </div>
  )
}

export default FilterPanel 

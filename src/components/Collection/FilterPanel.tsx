import Select from 'react-select'
import { Filter } from '../../reducers/collection'
import Button from '../common/Button'
import { Dispatch } from 'redux'
import * as actionTypes from '../../constants/ActionTypes'
import Icon from '../common/Icon'
import Modal from '../common/Modal'
import { useState, useEffect } from 'react'
import { State } from '../../reducers'
import { useSelector } from 'react-redux'

interface MediaItem {
  genres?: string[];
  type: string;
  stream?: Record<string, unknown>;
}

interface Artist {
  id: string;
  name: string;
}

interface Collection {
  rows: Record<string, MediaItem>;
  artists: Record<string, Artist>;
}

type Props = {
  collection: Collection;
  activeFilters: Filter;
  dispatch: Dispatch;
}

const FilterPanel = ({ collection, activeFilters, dispatch }: Props) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  
  // Only select the favorites part of state that's actually needed for filtering
  const favorites = useSelector((state: State) => state.favorites)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Get unique genres and types as before
  const genres = Object.values(collection.rows).reduce((acc: Set<string>, media: any) => {
    // Only process if genres exists and is an array
    if (Array.isArray(media.genres)) {
      media.genres.forEach((g: string) => acc.add(g))
    }
    return acc
  }, new Set())
  const types = new Set(Object.values(collection.rows).map((media: any) => media.type))

  // Get unique providers from the media items
  const providers = Object.values(collection.rows).reduce((acc: Set<string>, media: any) => {
    if (media.stream) {
      Object.keys(media.stream).forEach(provider => acc.add(provider));
    }
    return acc;
  }, new Set());

  // Create grouped options
  const groupedOptions = [
    {
      label: 'Genres',
      options: Array.from(genres).map(value => ({
        value: `genre:${value}`,
        label: value,
        color: '#ff9999' // Light red for genres
      }))
    },
    {
      label: 'Types',
      options: Array.from(types).map(value => ({
        value: `type:${value}`,
        label: value,
        color: '#99ff99' // Light green for types
      }))
    },
    {
      label: 'Artists',
      options: Object.values(collection.artists).map((artist: any) => ({
        value: `artist:${artist.id}`,
        label: artist.name,
        color: '#9999ff' // Light blue for artists
      }))
    },
    {
      label: 'Providers',
      options: Array.from(providers).map(value => ({
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
      label: collection.artists[a].name,
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

  const handleSaveSmartPlaylist = () => {
    const name = window.prompt('Enter a name for this smart playlist:')
    if (name) {
      dispatch({
        type: actionTypes.SAVE_SMART_PLAYLIST,
        playlist: {
          id: crypto.randomUUID(),
          name,
          filters: activeFilters,
          createdAt: new Date()
        }
      })
    }
  }

  const handleFilterChange = (filterType: keyof Filter, values: string[]) => {
    dispatch({
      type: actionTypes.SET_COLLECTION_FILTER,
      filterType,
      values,
      state: { favorites }
    })
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
        onClick={() => handleFilterChange('favorites', activeFilters.favorites ? [] : ['true'])}
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

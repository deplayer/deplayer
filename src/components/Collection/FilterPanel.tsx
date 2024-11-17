import Select from 'react-select'
import { Filter } from '../../reducers/collection'
import Button from '../common/Button'
import { Dispatch } from 'redux'
import * as actionTypes from '../../constants/ActionTypes'
import Icon from '../common/Icon'
import Modal from '../common/Modal'
import { useState, useEffect } from 'react'

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
  onFilterChange: (filterType: keyof Filter, values: string[]) => void;
  onClearFilters: () => void;
  dispatch: Dispatch;
}

const FilterPanel = ({ collection, activeFilters, onFilterChange, dispatch }: Props) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

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
      '&:hover': {
        borderColor: 'var(--select-border-hover)'
      }
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
      zIndex: 60,
    }),
    menuList: (provided: any) => ({
      ...provided,
      backgroundColor: 'var(--select-menu-bg)',
      backdropFilter: 'blur(8px)',
      maxHeight: '40vh',
    }),
    multiValue: (provided: any) => ({
      ...provided,
      backgroundColor: 'var(--select-multi-bg)'
    }),
    multiValueLabel: (provided: any) => ({
      ...provided,
      color: 'var(--select-text)'
    })
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

  const filterContent = (
    <div className='flex'>
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
            onFilterChange(`${type}s` as keyof Filter, values)
          })
        }}
        styles={customStyles}
        className="react-select-container"
        classNamePrefix="react-select"
        menuPosition="fixed"
        menuPlacement="auto"
      />
      {Object.values(activeFilters).some(arr => arr.length > 0) && (
        <Button
          size='xs'
          onClick={handleSaveSmartPlaylist}
          disabled={!Object.values(activeFilters).some(arr => arr.length > 0)}
          inverted
          transparent
          title="Save as smart playlist"
          className='cursor-pointer'
        >
          <Icon icon="faSave" className='px-1' />
        </Button>
      )}
    </div>
  )

  if (isMobile) {
    return (
      <>
        {isModalOpen && (
          <Modal
            title="Filter Collection"
            onClose={() => setIsModalOpen(false)}
          >
            <div className='w-full'>
              {filterContent}
            </div>
          </Modal>
        )}

        <Button
          transparent
          onClick={() => setIsModalOpen(true)}
          className="md:hidden"
        >
          <Icon icon="faFilter" className='px-1' />
          {Object.values(activeFilters).some(arr => arr.length > 0) && (
            <span className="ml-1 text-xs bg-blue-500 text-white rounded-full px-2">
              {Object.values(activeFilters).reduce((acc, arr) => acc + arr.length, 0)}
            </span>
          )}
        </Button>
      </>
    )
  }

  return (
    <div className="filter-panel hidden md:flex items-center space-x-2">
      {filterContent}
      <div className="vertical-divider border-l border-gray-500 mx-2" />
    </div>
  )
}

export default FilterPanel 

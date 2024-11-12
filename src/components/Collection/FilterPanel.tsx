import Select from 'react-select'
import { Filter } from '../../reducers/collection'
import Button from '../common/Button'
import Icon from '../common/Icon'
import { Dispatch } from 'redux'
import * as actionTypes from '../../constants/ActionTypes'

type Props = {
  collection: any
  activeFilters: Filter
  onFilterChange: (filterType: keyof Filter, values: string[]) => void
  onClearFilters: () => void
  dispatch: Dispatch
}

const FilterPanel = ({ collection, activeFilters, onFilterChange, dispatch }: Props) => {
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

  // Update custom styles to support dark mode
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
      border: '1px solid var(--select-border)'
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

  return (
    <div className="filter-panel py-2 pb-4 px-4 pr-6">
      <div className="flex justify-between mb-4">
        <Button
          onClick={handleSaveSmartPlaylist}
          disabled={!Object.values(activeFilters).some(arr => arr.length > 0)}
        >
          Save as Smart Playlist
          <Icon className='pl-2' icon='faSave' />
        </Button>
      </div>
      <style>
        {`
          :root {
            --select-bg: #fff;
            --select-border: #e2e8f0;
            --select-border-hover: #cbd5e0;
            --select-option-bg: #fff;
            --select-text: #1a202c;
            --select-menu-bg: #fff;
            --select-multi-bg: #e2e8f0;
          }
          
          .dark {
            --select-bg: #1a202c;
            --select-border: #2d3748;
            --select-border-hover: #4a5568;
            --select-option-bg: #1a202c;
            --select-text: #e2e8f0;
            --select-menu-bg: #1a202c;
            --select-multi-bg: #2d3748;
          }
        `}
      </style>
      <Select
        isMulti
        options={groupedOptions}
        value={selectedValues}
        onChange={(selected) => {
          // Split selected items by type and update filters
          const selectedItems = selected || []
          const genres = selectedItems
            .filter(item => item.value.startsWith('genre:'))
            .map(item => item.value.replace('genre:', ''))
          const types = selectedItems
            .filter(item => item.value.startsWith('type:'))
            .map(item => item.value.replace('type:', ''))
          const artists = selectedItems
            .filter(item => item.value.startsWith('artist:'))
            .map(item => item.value.replace('artist:', ''))
          const providers = selectedItems
            .filter(item => item.value.startsWith('provider:'))
            .map(item => item.value.replace('provider:', ''))

          onFilterChange('genres', genres)
          onFilterChange('types', types)
          onFilterChange('artists', artists)
          onFilterChange('providers', providers)
        }}
        styles={customStyles}
        className="react-select-container"
        classNamePrefix="react-select"
      />
    </div>
  )
}

export default FilterPanel 

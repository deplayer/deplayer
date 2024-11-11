import { Translate } from 'react-redux-i18n'
import Select from 'react-select'
import { Filter } from '../../reducers/collection'

type Props = {
  collection: any
  activeFilters: Filter
  onFilterChange: (filterType: keyof Filter, values: string[]) => void
  onClearFilters: () => void
}

const FilterPanel = ({ collection, activeFilters, onFilterChange, onClearFilters }: Props) => {
  // Get unique genres
  const genres = Object.values(collection.rows).reduce((acc: Set<string>, media: any) => {
    acc.add(media.genre)
    return acc
  }, new Set())

  // Get unique types
  const types = new Set(Object.values(collection.rows).map((media: any) => media.type))

  const formatOptions = (values: Set<string>) => 
    Array.from(values).map(value => ({ value, label: value }))

  return (
    <div className="filter-panel p-4">
      <h3 className="text-lg mb-4">
        <Translate value="filters.title" />
      </h3>

      <div className="mb-4">
        <label className="block mb-2">
          <Translate value="filters.genres" />
        </label>
        <Select
          isMulti
          options={formatOptions(genres)}
          value={activeFilters.genres.map(g => ({ value: g, label: g }))}
          onChange={(selected) => {
            onFilterChange('genres', selected ? selected.map(s => s.value) : [])
          }}
        />
      </div>

      <div className="mb-4">
        <label className="block mb-2">
          <Translate value="filters.types" />
        </label>
        <Select
          isMulti
          options={formatOptions(types)}
          value={activeFilters.types.map(t => ({ value: t, label: t }))}
          onChange={(selected) => {
            onFilterChange('types', selected ? selected.map(s => s.value) : [])
          }}
        />
      </div>

      <div className="mb-4">
        <label className="block mb-2">
          <Translate value="filters.artists" />
        </label>
        <Select
          isMulti
          options={Object.values(collection.artists).map((artist: any) => ({
            value: artist.id,
            label: artist.name
          }))}
          value={activeFilters.artists.map(a => {
            const artist = collection.artists[a]
            return { value: a, label: artist.name }
          })}
          onChange={(selected) => {
            onFilterChange('artists', selected ? selected.map(s => s.value) : [])
          }}
        />
      </div>

      <button 
        className="btn btn-secondary"
        onClick={onClearFilters}
      >
        <Translate value="filters.clear" />
      </button>
    </div>
  )
}

export default FilterPanel 
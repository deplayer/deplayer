import MenuItem from './MenuItem'
import Icon from '../common/Icon'
import FilterPanel from '../Collection/FilterPanel'
import { Dispatch } from 'redux'
import { Filter } from '../../reducers/collection'
import * as types from '../../constants/ActionTypes'

type Props = {
  dispatch: Dispatch,
  collection: any,
  totalItems: number,
  current?: Boolean
}

const CollectionMenuItem = ({ dispatch, collection, totalItems, current = false }: Props) => {
  const handleFilterChange = (filterType: keyof Filter, values: string[]) => {
    dispatch({
      type: types.SET_COLLECTION_FILTER,
      filterType,
      values
    })
  }

  const handleClearFilters = () => {
    dispatch({ type: types.CLEAR_COLLECTION_FILTERS })
  }

  const children = current ? (
    <ul>
      <MenuItem
        totalItems={totalItems}
        title='all'
        label='All'
        url='/collection'
        icon={<Icon icon='faDatabase' />}
      />
      <div className="w-64 border-r">
        <FilterPanel
          collection={collection}
          activeFilters={collection.activeFilters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />
      </div>
      <MenuItem
        totalItems={collection.mediaByType['video'].length}
        title='videos'
        label='Videos'
        url='/collection/video'
        icon={<Icon icon='faFilm' />}
      />
      <MenuItem
        totalItems={collection.mediaByType['audio'].length}
        title='Audio'
        label='Audio'
        url='/collection/audio'
        icon={<Icon icon='faFileAudio' />}
      />
    </ul>
  ) : null

  return (
    <MenuItem
      current={current}
      url='/collection'
      title='collection'
      label='Collection'
      icon={<Icon icon='faDatabase' />}
    >
      {children}
    </MenuItem>
  )
}

export default CollectionMenuItem

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

const CollectionMenuItem = ({ dispatch, collection, current = false }: Props) => {
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
    <div className="w-64 border-r">
      <FilterPanel
        dispatch={dispatch}
        collection={collection}
        activeFilters={collection.activeFilters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
      />
    </div>
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

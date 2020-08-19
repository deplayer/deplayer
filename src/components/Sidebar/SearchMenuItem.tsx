import * as React from 'react'

import MenuItem from './MenuItem'
import Icon from '../common/Icon'

type Props = {
  current?: Boolean,
  totalItems: number
}

const SearchMenuItem = ({current = false, totalItems}: Props) => {
  return (
    <MenuItem
      current={current}
      totalItems={totalItems}
      url='/search-results'
      title='search'
      label='Search'
      icon={<Icon icon='faSearch' />}
    />
  )
}

export default SearchMenuItem

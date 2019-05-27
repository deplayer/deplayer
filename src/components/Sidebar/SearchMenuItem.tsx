import * as React from 'react'

import MenuItem from './MenuItem'

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
      iconClasses='fa fa-search'
    />
  )
}

export default SearchMenuItem

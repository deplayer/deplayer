import * as React from 'react'

import MenuItem from './MenuItem'

type Props = {
  totalItems: number,
  current?: Boolean
}

const CollectionMenuItem = ({totalItems, current = false}: Props) => {
  return (
    <MenuItem
      totalItems={totalItems}
      current={current}
      url='/collection'
      title='collection'
      label='Collection'
      iconClasses='icon database outline'
    />
  )
}

export default CollectionMenuItem

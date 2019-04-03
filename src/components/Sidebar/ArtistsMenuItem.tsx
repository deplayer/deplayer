import * as React from 'react'

import MenuItem from './MenuItem'

type Props = {
  totalItems: number,
  current?: Boolean
}

const ArtistsMenuItem = ({totalItems, current = false}: Props) => {
  return (
    <MenuItem
      totalItems={totalItems}
      current={current}
      url='/artists'
      title='artists'
      label='Artists'
      iconClasses='icon fa fa-microphone'
    />
  )
}

export default ArtistsMenuItem

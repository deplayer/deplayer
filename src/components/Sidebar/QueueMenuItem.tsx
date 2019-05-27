import * as React from 'react'

import MenuItem from './MenuItem'

type Props = {
  totalItems: number,
  current?: Boolean
}

const QueueMenuItem = ({current = false, totalItems}: Props) => {
  return (
    <MenuItem
      totalItems={totalItems}
      current={current}
      url='/queue'
      title='now playing'
      label='Now playing'
      iconClasses='icon music outline'
    />
  )
}

export default QueueMenuItem

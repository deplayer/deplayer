import * as React from 'react'

import MenuItem from './MenuItem'

type Props = {
  current?: Boolean
}

const SettingsMenuItem = ({current = false}: Props) => {
  return (
    <MenuItem
      current={current}
      url='/settings'
      title='settings'
      label='Settings'
      iconClasses='icon cogs outline'
    />
  )
}

export default SettingsMenuItem

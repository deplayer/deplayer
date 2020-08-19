import * as React from 'react'

import MenuItem from './MenuItem'
import Icon from '../common/Icon'

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
      icon={ <Icon icon='faCogs' /> }
    />
  )
}

export default SettingsMenuItem

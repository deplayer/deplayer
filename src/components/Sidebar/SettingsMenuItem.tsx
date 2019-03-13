import * as React from 'react'
import classnames from 'classnames'

import { Link } from 'react-router-dom'

type Props = {
  current?: Boolean
}

const SettingsMenuItem = ({current = false}: Props) => {
  const classNames = classnames({
    button: true,
    current: current
  })
  return (
    <div className={ classNames }>
      <Link
        to="/settings"
        title="settings"
      >
        <i className='icon cogs outline'></i>
        Settings
      </Link>
    </div>
  )
}

export default SettingsMenuItem

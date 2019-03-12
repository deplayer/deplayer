import * as React from 'react'
import classnames from 'classnames'

import { Link } from 'react-router-dom'

type Props = {
  current?: Boolean
}

const SettingsButton = ({current = false}: Props) => {
  const classNames = classnames({
    button: true,
    'settings-button': true,
    current: current
  })
  return (
    <div className={classNames}>
      <Link to="/settings">
        <i className='icon cogs outline'></i>
      </Link>
    </div>
  )
}

export default SettingsButton

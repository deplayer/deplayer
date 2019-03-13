import * as React from 'react'
import classnames from 'classnames'

import { Link } from 'react-router-dom'

type Props = {
  current?: Boolean
}

const QueueMenuItem = ({current = false}: Props) => {
  const classNames = classnames({
    button: true,
    current: current
  })
  return (
    <div className={ classNames }>
      <Link
        to="/"
        title="playlists"
      >
        <i className='icon music outline'></i>
        Queue
      </Link>
    </div>
  )
}

export default QueueMenuItem

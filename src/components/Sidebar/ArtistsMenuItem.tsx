import * as React from 'react'
import classnames from 'classnames'

import { Link } from 'react-router-dom'

type Props = {
  current?: Boolean
}

const ArtistsMenuItem = ({current = false}: Props) => {
  const classNames = classnames({
    button: true,
    current: current
  })
  return (
    <div className={ classNames }>
      <Link
        to="/artists"
        title="artists"
      >
        <i className='icon fa fa-microphone'></i>
        Artists
      </Link>
    </div>
  )
}

export default ArtistsMenuItem

import * as React from 'react'
import classnames from 'classnames'

import { Link } from 'react-router-dom'

type Props = {
  current?: Boolean
}

const CollectionButton = ({current = false}: Props) => {
  const classNames = classnames({
    button: true,
    current: current
  })
  return (
    <div className={ classNames }>
      <Link
        to="/collection"
        title="collection"
      >
        <i className='icon database outline'></i>
      </Link>
    </div>
  )
}

export default CollectionButton

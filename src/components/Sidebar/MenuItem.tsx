import * as React from 'react'
import classnames from 'classnames'

import { Link } from 'react-router-dom'

type Props = {
  totalItems?: number,
  current?: Boolean,
  url: string,
  title: string,
  label: string,
  iconClasses: string
}

const MenuItem = (props: Props) => {
  const classNames = classnames({
    button: true,
    current: props.current
  })
  return (
    <div className={ classNames }>
      <Link
        to={ props.url }
        title={ props.title }
      >
        <i className={ props.iconClasses }></i>
        { props.label }
        <span className='badge'>
          { props.totalItems }
        </span>
      </Link>
    </div>
  )
}

export default MenuItem

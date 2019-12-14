import { Link } from 'react-router-dom'
import * as React from 'react'
import classnames from 'classnames'

import Tag from '../common/Tag'

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
    'hover:text-blue-900': true,
    'hover:bg-blue-400': true,
    'bg-gray-900': props.current
  })
  return (
    <li className={ classNames }>
      <Link
        className='flex justify-between items-center focus:bg-blue-400 focus:text-blue-900'
        to={ props.url }
        title={ props.title }
      >
        <div className='py-4'>
          <i className={ props.iconClasses }></i>
          { props.label }
        </div>

          { props.totalItems &&
            props.totalItems > 0  &&
          <div className=''>
            <Tag>
              { props.totalItems }
            </Tag>
          </div>
        }
      </Link>
    </li>
  )
}

export default MenuItem

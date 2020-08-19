import { Link } from 'react-router-dom'
import * as React from 'react'
import classnames from 'classnames'

import Tag from '../common/Tag'

type Props = {
  totalItems?: number,
  current?: Boolean,
  children?: React.ReactNode,
  onClick?: () => void,
  url: string,
  title: string,
  label: string,
  icon: React.ReactNode
}

const MenuItem = (props: Props) => {
  const classNames = classnames({
    button: true,
    'bg-gray-900': props.current
  })
  return (
    <li className={ classNames }>
      <Link
        className='flex justify-between items-center focus:bg-blue-400 focus:text-blue-900'
        to={ props.url }
        onClick={ props.onClick }
        title={ props.title }
      >
        <div className='py-4'>
          { props.icon }
          <span className='ml-4'>{ props.label }</span>
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

      { props.children }
    </li>
  )
}

export default MenuItem

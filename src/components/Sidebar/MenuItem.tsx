import React from 'react'
import { Link } from 'react-router-dom'
import classnames from 'classnames'

type MenuItemProps = {
  current: boolean,
  url: string,
  title: string,
  label: string,
  icon: React.ReactNode,
  totalItems?: number
}

const MenuItem = (props: MenuItemProps) => {
  const linkClasses = classnames(
    'flex items-center py-2 px-4 hover:bg-base-200 transition-colors duration-200 w-full',
  )

  const liClasses = classnames( 
    'w-full',
    {
      'bg-base-200': props.current,
      'text-primary': props.current,
    }
  )

  return (
    <li className={liClasses}>
      <Link to={props.url} className={linkClasses} title={props.title}>
        <span className='w-8'>{props.icon}</span>
        <span className='flex-1'>{props.label}</span>
        {props.totalItems !== undefined && (
          <span className='badge badge-sm'>{props.totalItems}</span>
        )}
      </Link>
    </li>
  )
}

export default MenuItem

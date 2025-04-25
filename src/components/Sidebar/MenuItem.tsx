import React from 'react'
import { Link } from 'react-router-dom'
import classnames from 'classnames'
import { Translate } from 'react-redux-i18n'

type MenuItemProps = {
  current: boolean,
  url: string,
  title: string,
  label: string,
  icon: React.ReactNode,
  totalItems?: number,
  translate?: boolean
}

const MenuItem = (props: MenuItemProps) => {
  const linkClasses = classnames(
    'flex items-center w-full transition-[var(--menu-transition)]',
    'hover:shadow-[var(--menu-hover-shadow)] hover:shadow-[var(--menu-hover-glow)]',
    'active:shadow-[var(--menu-active-shadow)] active:shadow-[var(--menu-active-glow)]',
    'hover:bg-[var(--menu-hover-bg)] active:bg-[var(--menu-active-bg)]',
    'text-[var(--menu-text)] hover:text-[var(--menu-active-text)]',
    'p-[var(--menu-padding)] rounded-[var(--menu-radius)]',
    'border-[var(--menu-border)]',
    'shadow-[var(--menu-shadow)] shadow-[var(--menu-glow)]',
  )

  const liClasses = classnames( 
    'w-full',
    {
      'bg-[var(--menu-active-bg)]': props.current,
      'text-[var(--menu-active-text)]': props.current,
      'shadow-[var(--menu-active-shadow)]': props.current,
      'shadow-[var(--menu-active-glow)]': props.current,
    }
  )

  const badgeClasses = classnames(
    'badge badge-sm',
    'bg-[var(--menu-badge-bg)]',
    'text-[var(--menu-badge-text)]',
    'rounded-[var(--menu-badge-radius)]',
    'p-[var(--menu-badge-padding)]',
    'font-[var(--menu-badge-font)]',
    'shadow-[var(--menu-badge-shadow)]',
    'shadow-[var(--menu-badge-glow)]',
  )

  const label = props.translate ? <Translate value={props.label} /> : props.label

  return (
    <li className={liClasses}>
      <Link to={props.url} className={linkClasses} title={props.title}>
        <span className='w-8'>{props.icon}</span>
        <span className='flex-1'>{label}</span>
        {props.totalItems !== undefined && (
          <span className={badgeClasses}>{props.totalItems}</span>
        )}
      </Link>
    </li>
  )
}

export default MenuItem

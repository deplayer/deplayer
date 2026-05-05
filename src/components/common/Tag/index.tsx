import React from 'react'
import classnames from 'classnames'

type Props = {
  children: React.ReactNode
  transparent?: boolean
  fullWidth?: boolean,
  type?: 'primary',
  onClick?: () => void,
  className?: string
}
 
const Tag = (props: Props) => {
  const classes = classnames({
    'w-full': props.fullWidth,
    'p-1': true,
    'px-2': true,
    'rounded-lg': true,
    'border': props.transparent,
    'border-base-content': true,
    'text-sm': true,
    'pw-2': true,
    'flex': true,
    'items-center': true,
  }, props.className)

  return (
    <div className={classes} onClick={props.onClick}>
      {props.children}
    </div>
  )
}

export default Tag

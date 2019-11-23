import React from 'react'
import classnames from 'classnames'

type Props = {
  children: any
  transparent?: boolean
  type?: 'primary'
}

const Tag = (props: Props) => {
  const classes = classnames({
    'p-1': true,
    'px-2': true,
    rounded: true,
    'text-white': !props.transparent,
    'bg-blue-800': !props.transparent,
    'border-none': !props.transparent,
    border: props.transparent,
    'text-blue-300': props.transparent,
    'border-blue-800': props.transparent,
    'text-sm': true,
    'w-auto': true,
    'inline-block': true,
    'pw-2': true
  })

  return (
    <div className={classes}>
      { props.children }
    </div>
  )
}

export default Tag

import React from 'react'
import classnames from 'classnames'

type Props = {
  onClick?: () => any,
  title?: string,
  children: any,
  inverted?: boolean,
  disabled?: boolean,
  transparent?: boolean,
  type?: 'submit' | 'button',
  className?: string
}

const Button = (props: Props) => {
  const classNames = classnames({
    'text-blue-100': true,
    'bg-blue-700': true,
    'p-2': true,
    'px-3': true,
    'rounded': true,
    'border-blue-100': props.inverted,
    'border-transparent': props.transparent,
    'bg-transparent': props.inverted || props.transparent
  })

  return (
    <button
      type={props.type || 'button'}
      disabled={props.disabled}
      className={classNames}
      title={props.title}
      onClick={props.onClick}
    >
      { props.children }
    </button>
  )
}

export default Button

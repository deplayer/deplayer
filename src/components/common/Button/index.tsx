import React from 'react'
import classnames from 'classnames'

type Props = {
  onClick?: () => any,
  title?: string,
  children: any,
  size?: 'lg' | '4xl' | '2xl',
  inverted?: boolean,
  long?: boolean,
  large?: boolean,
  disabled?: boolean,
  transparent?: boolean,
  fullWidth?: boolean,
  type?: 'submit' | 'button',
  className?: string
}

const Button = (props: Props) => {
  const classNames = classnames({
    'text-blue-200': !props.transparent,
    'bg-blue-700': !props.transparent,
    'text-xl': props.size === 'lg',
    'text-4xl': props.size === '4xl',
    'text-2xl': props.size === '2xl',
    'p-2': true,
    'px-2': true,
    'px-4': props.long || props.large,
    'rounded': true,
    'w-full': props.fullWidth,
    'border': !props.transparent,
    'border-blue-500': !props.inverted,
    'border-blue-200': props.inverted,
    'border-solid': props.inverted,
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

import React from 'react'
import classnames from 'classnames'

type Props = {
  onClick?: () => any,
  children: any,
  inverted?: boolean,
  className?: string
}

const Button = (props: Props) => {
  const classNames = classnames({
    'bg-blue-700': true,
    'p-2': true,
    'bg-transparent': props.inverted
  })

  return (
    <button
      className={classNames}
      onClick={props.onClick}
    >
      { props.children }
    </button>
  )
}

export default Button

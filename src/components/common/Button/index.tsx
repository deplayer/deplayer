import * as React from 'react'

type Props = {
  onClick?: () => any,
  children: any
}

const Button = (props: Props) => {
  return (
    <button
      className={''}
      onClick={props.onClick}
    >
      { props.children }
    </button>
  )
}

export default Button

import React from 'react'

type Props = {
  children: React.ReactNode
}

const Header = (props: Props) => {
  return (
    <h2>
      { props.children }
    </h2>
  )
}

export default Header

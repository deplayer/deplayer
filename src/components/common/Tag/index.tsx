import React from 'react'

type Props = {
  children: any
  type?: 'primary'
}

const Tag = (props: Props) => {
  return (
    <div className={props.type}>
      { props.children }
    </div>
  )
}

export default Tag

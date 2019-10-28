import React from 'react'

type Props = {
  children: any
  type?: 'primary'
}

const Tag = (props: Props) => {
  return (
    <Tag type={props.type}>
      { props.children }
    </Tag>
  )
}

export default Tag

import React from 'react'
import classnames from 'classnames'

type Props = {
  children: any
  type?: 'primary'
}

const Tag = (props: Props) => {
  const classes = classnames({
    border: true,
    'p-1': true,
    'pw-2': true
  })

  return (
    <div className={classes}>
      { props.children }
    </div>
  )
}

export default Tag

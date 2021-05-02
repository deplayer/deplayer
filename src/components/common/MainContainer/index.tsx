import React from 'react'
import classNames from 'classnames'

const MainContainer = (props: { children: React.ReactNode, centerContents?: boolean }) => {
  const classes = classNames({
    'z-30': true,
    'px-4': true,
    'w-full': true,
    'max-w-screen-md': true,
    'mx-auto': props.centerContents
  })
  return (
    <div className={classes}>
      { props.children }
    </div>
  )
}

export default MainContainer

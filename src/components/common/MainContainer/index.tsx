import React from 'react'

const MainContainer = (props: { children: React.ReactNode}) => {
  return (
    <div className='main z-30 px-4 md:p-0'>
      { props.children }
    </div>
  )
}

export default MainContainer

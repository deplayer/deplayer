import * as React from 'react'

const Title = (props: { onClick: () => void, title?: React.ReactNode }) => {
  return (
    <div className='text-xl text-sans truncate'>
      <h2 onClick={props.onClick}>
        { props.title }
      </h2>
    </div>
  )
}

export default Title

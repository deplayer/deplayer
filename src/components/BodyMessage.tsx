import * as React from 'react'

const BodyMessage = (props: any) => {
  return (
    <div className={`queue`}>
      <blockquote className='blockquote'>
        <p>{ props.message }</p>
      </blockquote>
    </div>
  )
}

export default BodyMessage

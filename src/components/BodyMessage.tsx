import * as React from 'react'

type Props = {
  message: string
}

const BodyMessage = (props: Props) => {
  return (
    <div className={`queue`}>
      <blockquote className='blockquote'>
        <p>{ props.message }</p>
      </blockquote>
    </div>
  )
}

export default BodyMessage

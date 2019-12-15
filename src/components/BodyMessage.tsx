import * as React from 'react'

type Props = {
  message: React.ReactNode
}

const BodyMessage = (props: Props) => {
  return (
    <div className='queue z-10 w-full h-full flex justify-center '>
      <blockquote className='blockquote text-lg text-center px-12'>
        { props.message }
      </blockquote>
    </div>
  )
}

export default BodyMessage

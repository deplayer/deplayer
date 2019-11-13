import React from 'react'

type Props = {
  children: any
  type?: 'primary'
}

const Tag = (props: Props) => {
  return (
    <div className='px-2 text-blue-300 border border-blue-800 text-sm w-auto inline-block'>
      { props.children }
    </div>
  )
}

export default Tag

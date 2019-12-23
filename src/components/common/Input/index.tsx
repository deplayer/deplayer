import React from 'react'

type Props = {
  type: 'text',
  value: string,
  onChange: (event: any) => void
}

const Input = (props: Props) => {
  return (
    <input
      className='p-3 w-full bg-blue-900 text-blue-100 font-sans rounded'
      type={props.type}
      value={props.value}
      onChange={props.onChange}
    />
  )
}

export default Input

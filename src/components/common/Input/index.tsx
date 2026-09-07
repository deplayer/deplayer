import React from 'react'

type Props = {
  type: 'text',
  value: string,
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void,
  placeholder?: string,
  className?: string,
  'aria-label'?: string
}

const Input = (props: Props) => {
    return (
      <input
        className={`input input-bordered w-full ${props.className || ''}`}
        type={props.type}
        value={props.value}
        onChange={props.onChange}
        placeholder={props.placeholder}
        aria-label={props['aria-label']}
      />
    )
}

export default Input

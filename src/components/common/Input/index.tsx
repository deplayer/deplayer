type Props = {
  type: 'text',
  value: string,
  onChange: (event: any) => void
}

const Input = (props: Props) => {
  return (
    <input
      className='p-3 w-full bg-sky-900 text-sky-100 font-sans rounded'
      type={props.type}
      value={props.value}
      onChange={props.onChange}
    />
  )
}

export default Input

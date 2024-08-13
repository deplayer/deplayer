import classnames from 'classnames'

type Props = {
  children: any
  transparent?: boolean
  fullWidth?: boolean,
  type?: 'primary'
}

const Tag = (props: Props) => {
  const classes = classnames({
    'w-full': props.fullWidth,
    'p-1': true,
    'px-2': true,
    rounded: true,
    'text-white': !props.transparent,
    'bg-blue-800': !props.transparent,
    'border-none': !props.transparent,
    border: props.transparent,
    'text-blue-300': props.transparent,
    'border-blue-800': props.transparent,
    'text-sm': true,
    'pw-2': true,
    'flex': true,
    'items-center': true
  })

  return (
    <div className={classes}>
      {props.children}
    </div>
  )
}

export default Tag

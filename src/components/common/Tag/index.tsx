import classnames from 'classnames'

type Props = {
  children: any
  transparent?: boolean
  fullWidth?: boolean,
  type?: 'primary',
  onClick?: () => void,
  className?: string
}

const Tag = (props: Props) => {
  const classes = classnames({
    'w-full': props.fullWidth,
    'p-1': true,
    'px-2': true,
    rounded: true,
    'dark:text-sky-300': !props.transparent,
    'text-sky-900': !props.transparent,
    'dark:bg-sky-950': !props.transparent,
    'bg-sky-200': !props.transparent,
    'border-none': !props.transparent,
    border: props.transparent,
    'dark:text-blue-300': props.transparent,
    'text-blue-900': props.transparent,
    'border-blue-800': props.transparent,
    'text-sm': true,
    'pw-2': true,
    'flex': true,
    'items-center': true,
    'opacity-90': true
  }, props.className)

  return (
    <div className={classes} onClick={props.onClick}>
      {props.children}
    </div>
  )
}

export default Tag

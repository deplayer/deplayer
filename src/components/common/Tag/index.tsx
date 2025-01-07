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
    'rounded': true,
    'text-success': true,
    'border-success': true,
    'bg-base-200': !props.transparent,
    'border-none': !props.transparent,
    'border': props.transparent,
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

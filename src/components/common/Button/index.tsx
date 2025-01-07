import classnames from 'classnames'

type Props = {
  onClick?: () => any,
  title?: string,
  children: any,
  size?: 'xs' | 'lg' | '4xl' | '2xl',
  inverted?: boolean,
  long?: boolean,
  large?: boolean,
  alignLeft?: boolean,
  disabled?: boolean,
  transparent?: boolean,
  uppercase?: boolean,
  fullWidth?: boolean,
  type?: 'submit' | 'button',
  roundedFull?: boolean,
  className?: string
}

const Button = (props: Props) => {
  const classNames = classnames({
    'btn': true,
    'flex': true,
    'items-center': true,
    'uppercase': props.uppercase,
    'btn-ghost': props.transparent,
    'text-primary': props.transparent,
    'hover:text-primary-focus': props.transparent,
    'hover:bg-base-200': props.transparent,
    'btn-circle': props.roundedFull,
    'text-base': props.size === 'lg',
    'text-xl': props.size === 'lg',
    'text-4xl': props.size === '4xl',
    'text-2xl': props.size === '2xl',
    'text-xs': props.size === 'xs',
    'text-left': props.alignLeft,
    'justify-center': !props.alignLeft,
    'text-center': !props.alignLeft,
    'rounded': true,
    'rounded-full': props.roundedFull,
    'w-full': props.fullWidth,
  }, props.className)

  return (
    <button
      type={props.type || 'button'}
      disabled={props.disabled}
      className={classNames}
      title={props.title}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  )
}

export default Button

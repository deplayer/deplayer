import classnames from 'classnames'

type Props = {
  onClick?: () => any,
  title?: string,
  children: any,
  size?: 'lg' | '4xl' | '2xl',
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
    flex: true,
    'items-center': true,
    uppercase: props.uppercase,
    'text-sky-800': !props.transparent || props.inverted,
    'dark:text-sky-200': !props.transparent || props.inverted,
    'hover:text-blue-200': !props.transparent || props.inverted,
    'bg-sky-700': !props.transparent && !props.inverted,
    'hover:bg-sky-500': !props.transparent && !props.inverted,
    'text-base': props.size === 'lg',
    'text-xl': props.size === 'lg',
    'text-4xl': props.size === '4xl',
    'text-2xl': props.size === '2xl',
    'text-left': props.alignLeft,
    'justify-center': !props.alignLeft,
    'text-center': !props.alignLeft,
    'p-2': true,
    'px-2': true,
    'px-4': props.long || props.large,
    'rounded': true,
    'rounded-full': props.roundedFull,
    'w-full': props.fullWidth,
    'border': !props.transparent || props.inverted,
    'border-blue-500': !props.inverted,
    'border-blue-400': props.inverted,
    'hover:border-blue-200': props.inverted,
    'border-solid': props.inverted,
    'border-transparent': props.transparent,
    'bg-transparent': props.inverted || props.transparent,
  })

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

import classnames from 'classnames'
import { ReactNode } from 'react'

type Props = {
  onClick?: () => void,
  title?: string,
  children: ReactNode,
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl',
  variant?: 'default' | 'ghost' | 'outline' | 'glow' | 'cassette',
  disabled?: boolean,
  transparent?: boolean,
  inverted?: boolean,
  large?: boolean,
  long?: boolean,
  uppercase?: boolean,
  fullWidth?: boolean,
  alignLeft?: boolean,
  type?: 'submit' | 'button',
  roundedFull?: boolean,
  className?: string,
  'data-testid'?: string,
  'aria-label'?: string
}

const Button = (props: Props) => {
  const classNames = classnames({
    'btn': true,
    'inline-flex': true,
    'items-center': true,
    'justify-center': !props.alignLeft,
    'justify-start': props.alignLeft,
    'relative': true,
    'overflow-hidden': true,
    'whitespace-nowrap': true,
    'text-ellipsis': true,
    'gap-2': true,
    'uppercase': props.uppercase,
    'w-full': props.fullWidth || props.long,
    'rounded-full': props.roundedFull,
    'rounded': !props.roundedFull,
    'transition-all': true,
    'duration-200': true,
    'ease-in-out': true,
    'font-mono': true,
    'tracking-wider': true,
    'text-shadow-sm': true,
    'disabled:opacity-50': true,
    'disabled:cursor-not-allowed': true,
    'disabled:pointer-events-none': true,
    'hover:scale-[1.02]': true,
    'active:scale-[0.98]': true,
    // Style variants
    'btn-ghost': props.variant === 'ghost',
    'btn-outline': props.variant === 'outline',
    'bg-primary': props.variant === 'default' && !props.inverted,
    'text-primary-content': props.variant === 'default' && !props.inverted,
    'hover:bg-primary-focus': props.variant === 'default' && !props.inverted,
    'bg-base-300': props.inverted || props.variant === 'cassette',
    'text-base-content': props.inverted || props.variant === 'cassette',
    'hover:bg-base-200': props.inverted || props.variant === 'cassette',
    'border-2': props.variant === 'outline' || props.variant === 'cassette',
    'border-primary': props.variant === 'outline' || props.variant === 'cassette',
    'text-primary': props.variant === 'outline',
    'hover:bg-primary': props.variant === 'outline',
    'hover:text-primary-content': props.variant === 'outline',
    // Size variants
    'text-xs': props.size === 'xs',
    'text-sm': props.size === 'sm',
    'text-base': props.size === 'md' || props.large,
    'text-lg': props.size === 'lg',
    'text-xl': props.size === 'xl',
    'text-2xl': props.size === '2xl',
    'text-4xl': props.size === '4xl',
    // Cassette-futurism specific styles
    'before:content-[""]': props.variant === 'cassette' || props.variant === 'glow',
    'before:absolute': props.variant === 'cassette' || props.variant === 'glow',
    'before:inset-0': props.variant === 'cassette' || props.variant === 'glow',
    'before:rounded-[inherit]': props.variant === 'cassette' || props.variant === 'glow',
    'before:opacity-0': props.variant === 'cassette' || props.variant === 'glow',
    'before:transition-opacity': props.variant === 'cassette' || props.variant === 'glow',
    'before:shadow-[var(--btn-glow)]': props.variant === 'cassette' || props.variant === 'glow',
    'hover:before:opacity-100': props.variant === 'cassette' || props.variant === 'glow',
    'hover:before:shadow-[var(--btn-hover-glow)]': props.variant === 'cassette' || props.variant === 'glow',
    // Cassette specific styles
    'hover:border-primary-focus': props.variant === 'cassette',
    'after:content-[""]': props.variant === 'cassette',
    'after:absolute': props.variant === 'cassette',
    'after:inset-0': props.variant === 'cassette',
    'after:bg-gradient-to-r': props.variant === 'cassette',
    'after:from-transparent': props.variant === 'cassette',
    'after:via-primary/20': props.variant === 'cassette',
    'after:to-transparent': props.variant === 'cassette',
    'after:opacity-0': props.variant === 'cassette',
    'after:transition-opacity': props.variant === 'cassette',
    'hover:after:opacity-100': props.variant === 'cassette',
  }, props.className)

  return (
    <button
      type={props.type || 'button'}
      disabled={props.disabled}
      className={classNames}
      title={props.title}
      onClick={props.onClick}
      data-testid={props['data-testid']}
      aria-label={props['aria-label']}
    >
      <span className={`inline-flex items-center gap-2 truncate${props.fullWidth ? ' w-full' : ''}`}>
        {props.children}
      </span>
    </button>
  )
}

export default Button

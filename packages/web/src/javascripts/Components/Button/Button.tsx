import { Ref, forwardRef, ReactNode, ComponentPropsWithoutRef } from 'react'

const baseClass = 'rounded px-4 py-1.75 font-bold text-sm fit-content'

type ButtonVariant = 'normal' | 'primary'

const getClassName = (variant: ButtonVariant, danger: boolean, disabled: boolean) => {
  const borders = variant === 'normal' ? 'border-solid border-border border-1' : 'no-border'
  const cursor = disabled ? 'cursor-not-allowed' : 'cursor-pointer'

  let colors = variant === 'normal' ? 'bg-default text-text' : 'bg-info text-info-contrast'

  let focusHoverStates =
    variant === 'normal'
      ? 'focus:bg-contrast focus:outline-none hover:bg-contrast'
      : 'hover:brightness-130 focus:outline-none focus:brightness-130'

  if (danger) {
    colors = variant === 'normal' ? 'bg-default text-danger' : 'bg-danger text-info-contrast'
  }

  if (disabled) {
    colors = variant === 'normal' ? 'bg-default text-passive-2' : 'bg-passive-2 text-info-contrast'
    focusHoverStates =
      variant === 'normal'
        ? 'focus:bg-default focus:outline-none hover:bg-default'
        : 'focus:brightness-default focus:outline-none hover:brightness-default'
  }

  return `${baseClass} ${colors} ${borders} ${focusHoverStates} ${cursor}`
}

interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  children?: ReactNode
  className?: string
  variant?: ButtonVariant
  dangerStyle?: boolean
  label?: string
}

const Button = forwardRef(
  (
    {
      variant = 'normal',
      label,
      className = '',
      dangerStyle: danger = false,
      disabled = false,
      children,
      ...props
    }: ButtonProps,
    ref: Ref<HTMLButtonElement>,
  ) => {
    return (
      <button
        type="button"
        className={`${getClassName(variant, danger, disabled)} ${className}`}
        disabled={disabled}
        ref={ref}
        {...props}
      >
        {label ?? children}
      </button>
    )
  },
)

export default Button

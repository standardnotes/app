import { Ref, forwardRef, ReactNode, ComponentPropsWithoutRef } from 'react'

type OverrideClassNames = {
  padding?: string
  width?: string
}

const baseClass = (overrides?: OverrideClassNames) =>
  `rounded ${overrides?.padding ? overrides.padding : 'px-4 py-1.5'} font-bold text-sm ${
    overrides?.width ? overrides.width : 'w-fit'
  }`

type ButtonVariant = 'normal' | 'primary'

const getClassName = (variant: ButtonVariant, danger: boolean, disabled: boolean, overrides?: OverrideClassNames) => {
  const borders = variant === 'normal' ? 'border-solid border-border border' : 'no-border'
  const cursor = disabled ? 'cursor-not-allowed' : 'cursor-pointer'

  let colors = variant === 'normal' ? 'bg-default text-text' : 'bg-info text-info-contrast'

  let focusHoverStates =
    variant === 'normal'
      ? 'focus:bg-contrast focus:outline-none hover:bg-contrast'
      : 'hover:brightness-125 focus:outline-none focus:brightness-125'

  if (danger) {
    colors = variant === 'normal' ? 'bg-default text-danger' : 'bg-danger text-info-contrast'
  }

  if (disabled) {
    colors = variant === 'normal' ? 'bg-default text-passive-2' : 'bg-passive-2 text-info-contrast'
    focusHoverStates =
      variant === 'normal'
        ? 'focus:bg-default focus:outline-none hover:bg-default'
        : 'focus:brightness-100 focus:outline-none hover:brightness-100'
  }

  return `${baseClass(overrides)} ${colors} ${borders} ${focusHoverStates} ${cursor}`
}

interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  children?: ReactNode
  className?: string
  variant?: ButtonVariant
  dangerStyle?: boolean
  label?: string
  overrideClassNames?: OverrideClassNames
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
      overrideClassNames,
      ...props
    }: ButtonProps,
    ref: Ref<HTMLButtonElement>,
  ) => {
    return (
      <button
        type="button"
        className={`${getClassName(variant, danger, disabled, overrideClassNames)} ${className}`}
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

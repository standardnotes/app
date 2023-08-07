import { Ref, forwardRef, ReactNode, ComponentPropsWithoutRef } from 'react'

export type ButtonStyle = 'default' | 'contrast' | 'neutral' | 'info' | 'warning' | 'danger' | 'success'

const getColorsForNormalVariant = (style: ButtonStyle) => {
  switch (style) {
    case 'default':
      return 'bg-normal-button text-text'
    case 'contrast':
      return 'bg-normal-button text-contrast'
    case 'neutral':
      return 'bg-normal-button text-neutral'
    case 'info':
      return 'bg-normal-button text-info'
    case 'warning':
      return 'bg-normal-button text-warning'
    case 'danger':
      return 'bg-normal-button text-danger'
    case 'success':
      return 'bg-normal-button text-success'
  }
}

export const getColorsForPrimaryVariant = (style: ButtonStyle) => {
  switch (style) {
    case 'default':
      return 'bg-default text-foreground'
    case 'contrast':
      return 'bg-contrast text-text'
    case 'neutral':
      return 'bg-neutral text-neutral-contrast'
    case 'info':
      return 'bg-info text-info-contrast'
    case 'warning':
      return 'bg-warning text-warning-contrast'
    case 'danger':
      return 'bg-danger text-danger-contrast'
    case 'success':
      return 'bg-success text-success-contrast'
  }
}

const getClassName = (
  primary: boolean,
  style: ButtonStyle,
  disabled: boolean,
  fullWidth?: boolean,
  small?: boolean,
  isRounded?: boolean,
) => {
  const borders = primary ? 'no-border' : 'border-solid border-border border'
  const cursor = disabled ? 'cursor-not-allowed' : 'cursor-pointer'
  const width = fullWidth ? 'w-full' : 'w-fit'
  const padding = small ? 'px-3 py-1.5' : 'px-4 py-1.5'
  const textSize = small ? 'text-sm lg:text-xs' : 'text-base lg:text-sm'
  const rounded = isRounded ? 'rounded' : ''

  let colors = primary ? getColorsForPrimaryVariant(style) : getColorsForNormalVariant(style)

  let focusHoverStates = primary
    ? 'hover:brightness-125 focus:outline-none focus-visible:brightness-125'
    : 'focus:bg-contrast focus:outline-none hover:bg-contrast'

  if (disabled) {
    colors = primary ? 'bg-passive-2 text-info-contrast' : 'bg-default text-passive-2'
    focusHoverStates = primary
      ? 'focus:brightness-100 focus:outline-none hover:brightness-100'
      : 'focus:bg-default focus:outline-none hover:bg-default'
  }

  return `${rounded} font-bold select-none ${width} ${padding} ${textSize} ${colors} ${borders} ${focusHoverStates} ${cursor}`
}

interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  children?: ReactNode
  className?: string
  primary?: boolean
  colorStyle?: ButtonStyle
  label?: string
  fullWidth?: boolean
  small?: boolean
  rounded?: boolean
}

const Button = forwardRef(
  (
    {
      primary = false,
      label,
      className = '',
      colorStyle = primary ? 'info' : 'default',
      disabled = false,
      children,
      fullWidth,
      small,
      rounded = true,
      ...props
    }: ButtonProps,
    ref: Ref<HTMLButtonElement>,
  ) => {
    return (
      <button
        type="button"
        className={`${getClassName(primary, colorStyle, disabled, fullWidth, small, rounded)} ${className}`}
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

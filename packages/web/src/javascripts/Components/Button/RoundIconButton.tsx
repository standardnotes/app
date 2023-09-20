import { ComponentPropsWithoutRef, ForwardedRef, forwardRef, MouseEventHandler } from 'react'
import Icon from '@/Components/Icon/Icon'
import { IconType } from '@standardnotes/snjs'
import { classNames } from '@standardnotes/utils'
import StyledTooltip from '../StyledTooltip/StyledTooltip'

type Props = {
  onClick: MouseEventHandler
  className?: string
  icon: IconType
  iconClassName?: string
  iconProps?: Partial<Parameters<typeof Icon>[0]>
  label: string
  id?: string
} & ComponentPropsWithoutRef<'button'>

const RoundIconButton = forwardRef(
  (
    { onClick, className, icon: iconType, iconClassName, iconProps, id, label, ...props }: Props,
    ref: ForwardedRef<HTMLButtonElement>,
  ) => {
    const click: MouseEventHandler = (e) => {
      e.preventDefault()
      onClick(e)
    }
    return (
      <StyledTooltip label={label}>
        <button
          className={classNames(
            'bg-text-padding m-0 flex h-10 min-w-10 cursor-pointer items-center justify-center rounded-full border',
            'border-solid border-border bg-clip-padding text-neutral hover:bg-contrast hover:text-text focus:bg-contrast',
            'focus:text-text focus:outline-none focus:ring-info md:h-8 md:min-w-8',
            className,
          )}
          onClick={click}
          ref={ref}
          id={id}
          aria-label={label}
          {...props}
        >
          <Icon {...iconProps} type={iconType} className={iconClassName} />
        </button>
      </StyledTooltip>
    )
  },
)

export default RoundIconButton

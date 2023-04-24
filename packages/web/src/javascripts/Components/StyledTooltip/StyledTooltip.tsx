import { classNames } from '@standardnotes/snjs'
import { ReactNode } from 'react'
import { Tooltip, TooltipAnchor, TooltipStoreProps, useTooltipStore } from '@ariakit/react'
import { Slot } from '@radix-ui/react-slot'

const StyledTooltip = ({
  children,
  className,
  label,
  ...props
}: {
  children: ReactNode
  className?: string
  label: string
} & Partial<TooltipStoreProps>) => {
  const tooltip = useTooltipStore(props)

  return (
    <>
      <TooltipAnchor store={tooltip} as={Slot}>
        {children}
      </TooltipAnchor>
      <Tooltip
        store={tooltip}
        className={classNames(
          'z-tooltip rounded border border-border bg-contrast py-1.5 px-3 text-sm text-foreground shadow',
          className,
        )}
      >
        {label}
      </Tooltip>
    </>
  )
}

export default StyledTooltip

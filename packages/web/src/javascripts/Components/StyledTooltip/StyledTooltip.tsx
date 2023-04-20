import { classNames } from '@standardnotes/snjs'
import { ReactNode } from 'react'
import { Tooltip, TooltipAnchor, useTooltipStore } from '@ariakit/react'
import { Slot } from '@radix-ui/react-slot'

const StyledTooltip = ({ children, className, label }: { children: ReactNode; className?: string; label: string }) => {
  const tooltip = useTooltipStore()

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

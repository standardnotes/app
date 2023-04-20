import * as Tooltip from '@radix-ui/react-tooltip'
import { classNames } from '@standardnotes/snjs'
import { ReactNode } from 'react'

const StyledTooltip = ({ children, className, label }: { children: ReactNode; className?: string; label: string }) => {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          className={classNames(
            'z-tooltip rounded border border-border bg-contrast py-1.5 px-3 text-sm text-foreground shadow',
            className,
          )}
          collisionPadding={5}
          sideOffset={5}
        >
          {label}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

export default StyledTooltip

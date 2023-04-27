import { classNames } from '@standardnotes/snjs'
import { ReactNode } from 'react'
import { Tooltip, TooltipAnchor, TooltipStoreProps, useTooltipStore } from '@ariakit/react'
import { Slot } from '@radix-ui/react-slot'
import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'
import { getPositionedPopoverStyles } from '../Popover/GetPositionedPopoverStyles'

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
  const tooltip = useTooltipStore({
    timeout: 350,
    renderCallback(props) {
      const { popoverElement, anchorElement } = props

      const documentElement = document.querySelector('.main-ui-view')

      if (!popoverElement || !anchorElement || !documentElement) {
        return
      }

      const anchorRect = anchorElement.getBoundingClientRect()
      const popoverRect = popoverElement.getBoundingClientRect()
      const documentRect = documentElement.getBoundingClientRect()

      const styles = getPositionedPopoverStyles({
        align: 'center',
        side: 'bottom',
        anchorRect,
        popoverRect,
        documentRect,
        disableMobileFullscreenTakeover: true,
        offset: 6,
      })

      Object.assign(popoverElement.style, styles)
    },
    ...props,
  })
  const isMobile = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)

  if (isMobile) {
    return <>{children}</>
  }

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

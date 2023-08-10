import { classNames } from '@standardnotes/snjs'
import { ReactNode, useState } from 'react'
import { Tooltip, TooltipAnchor, TooltipOptions, useTooltipStore } from '@ariakit/react'
import { Slot } from '@radix-ui/react-slot'
import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'
import { getPositionedPopoverStyles } from '../Popover/GetPositionedPopoverStyles'
import { getAdjustedStylesForNonPortalPopover } from '../Popover/Utils/getAdjustedStylesForNonPortal'

const StyledTooltip = ({
  children,
  className,
  label,
  showOnMobile = false,
  showOnHover = true,
  interactive = false,
  ...props
}: {
  children: ReactNode
  label: NonNullable<ReactNode>
  className?: string
  showOnMobile?: boolean
  showOnHover?: boolean
  interactive?: boolean
} & Partial<TooltipOptions>) => {
  const [forceOpen, setForceOpen] = useState<boolean | undefined>()

  const tooltip = useTooltipStore({
    timeout: 500,
    hideTimeout: 0,
    skipTimeout: 0,
    open: forceOpen,
  })
  const isMobile = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)

  if (isMobile && !showOnMobile) {
    return <>{children}</>
  }

  return (
    <>
      <TooltipAnchor
        onClick={() => setForceOpen(false)}
        onBlur={() => setForceOpen(undefined)}
        store={tooltip}
        as={Slot}
        showOnHover={showOnHover}
      >
        {children}
      </TooltipAnchor>
      <Tooltip
        tabIndex={undefined}
        autoFocusOnShow={!showOnHover}
        store={tooltip}
        className={classNames(
          'z-tooltip max-w-max rounded border border-border translucent-ui:border-[--popover-border-color] bg-contrast translucent-ui:bg-[--popover-background-color] [backdrop-filter:var(--popover-backdrop-filter)] px-3 py-1.5 text-sm text-foreground shadow',
          className,
        )}
        updatePosition={() => {
          const { popoverElement, anchorElement, open } = tooltip.getState()

          if (!interactive && popoverElement) {
            popoverElement.style.pointerEvents = 'none'
          }

          const documentElement = document.querySelector('.main-ui-view')

          if (!popoverElement || !anchorElement || !documentElement || !open) {
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
            offset: props.gutter ? props.gutter : 6,
          })

          if (!styles) {
            return
          }

          Object.assign(popoverElement.style, styles)

          if (!props.portal) {
            const adjustedStyles = getAdjustedStylesForNonPortalPopover(popoverElement, styles)
            popoverElement.style.setProperty('--translate-x', adjustedStyles['--translate-x'])
            popoverElement.style.setProperty('--translate-y', adjustedStyles['--translate-y'])
          }
        }}
        {...props}
      >
        {label}
      </Tooltip>
    </>
  )
}

export default StyledTooltip

import { classNames } from '@standardnotes/snjs'
import { ReactNode, useState } from 'react'
import { Tooltip, TooltipAnchor, TooltipOptions, useTooltipStore } from '@ariakit/react'
import { Slot } from '@radix-ui/react-slot'
import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'
import { getPositionedPopoverStyles } from '../Popover/GetPositionedPopoverStyles'

function getAbsolutePositionedParent(element: HTMLElement | null): HTMLElement | null {
  if (!element) {
    return null
  }

  const parent = element.parentElement

  if (!parent) {
    return null
  }

  const position = window.getComputedStyle(parent).getPropertyValue('position')

  if (position === 'absolute') {
    return parent
  }

  return getAbsolutePositionedParent(parent)
}

const StyledTooltip = ({
  children,
  className,
  label,
  showOnMobile = false,
  showOnHover = true,
  ...props
}: {
  children: ReactNode
  label: NonNullable<ReactNode>
  className?: string
  showOnMobile?: boolean
  showOnHover?: boolean
} & Partial<TooltipOptions>) => {
  const [forceOpen, setForceOpen] = useState<boolean | undefined>()

  const tooltip = useTooltipStore({
    timeout: 350,
    open: forceOpen,
  })
  const isMobile = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)

  if (isMobile && !showOnMobile) {
    return <>{children}</>
  }

  return (
    <>
      <TooltipAnchor
        onFocus={() => setForceOpen(true)}
        onBlur={() => setForceOpen(undefined)}
        store={tooltip}
        as={Slot}
        showOnHover={showOnHover}
      >
        {children}
      </TooltipAnchor>
      <Tooltip
        autoFocusOnShow={!showOnHover}
        store={tooltip}
        className={classNames(
          'z-tooltip max-w-max rounded border border-border bg-contrast py-1.5 px-3 text-sm text-foreground shadow',
          className,
        )}
        updatePosition={() => {
          const { popoverElement, anchorElement } = tooltip.getState()

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

          if (!styles) {
            return
          }

          Object.assign(popoverElement.style, styles)
          popoverElement.style.setProperty('--translate-x', styles['--translate-x'])
          popoverElement.style.setProperty('--translate-y', styles['--translate-y'])

          if (!props.portal) {
            const translateX = parseInt(styles['--translate-x'])
            const translateY = parseInt(styles['--translate-y'])

            const absolutePositionedParent = getAbsolutePositionedParent(popoverElement)

            if (!absolutePositionedParent) {
              return
            }

            const parentRect = absolutePositionedParent.getBoundingClientRect()

            const adjustedTranslateX = translateX - parentRect.left
            const adjustedTranslateY = translateY - parentRect.top

            popoverElement.style.setProperty('--translate-x', `${adjustedTranslateX}px`)
            popoverElement.style.setProperty('--translate-y', `${adjustedTranslateY}px`)
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

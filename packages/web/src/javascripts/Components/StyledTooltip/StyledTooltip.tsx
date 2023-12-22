import { classNames } from '@standardnotes/snjs'
import { ReactNode, useState, useRef, useEffect } from 'react'
import { Tooltip, TooltipAnchor, TooltipOptions, TooltipStoreProps, useTooltipStore } from '@ariakit/react'
import { Slot } from '@radix-ui/react-slot'
import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'
import { getPositionedPopoverStyles } from '../Popover/GetPositionedPopoverStyles'
import { getAdjustedStylesForNonPortalPopover } from '../Popover/Utils/getAdjustedStylesForNonPortal'
import { useLongPressEvent } from '@/Hooks/useLongPress'
import { PopoverSide } from '../Popover/Types'
import { getScrollParent } from '@/Utils'

const StyledTooltip = ({
  children,
  className,
  label,
  showOnMobile = false,
  showOnHover = true,
  interactive = false,
  type = 'label',
  side,
  documentElement,
  ...props
}: {
  children: ReactNode
  label: NonNullable<ReactNode>
  className?: string
  showOnMobile?: boolean
  showOnHover?: boolean
  interactive?: boolean
  type?: TooltipStoreProps['type']
  side?: PopoverSide
  documentElement?: HTMLElement
} & Partial<TooltipOptions>) => {
  const [forceOpen, setForceOpen] = useState<boolean | undefined>()

  const isMobile = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)
  const tooltip = useTooltipStore({
    timeout: isMobile && showOnMobile ? 100 : 500,
    hideTimeout: 0,
    skipTimeout: 0,
    open: forceOpen,
    animated: true,
    type,
  })

  const anchorRef = useRef<HTMLElement>(null)
  const { attachEvents: attachLongPressEvents, cleanupEvents: cleanupLongPressEvents } = useLongPressEvent(
    anchorRef,
    () => {
      tooltip.show()
      setTimeout(() => {
        tooltip.hide()
      }, 2000)
    },
  )

  useEffect(() => {
    if (!isMobile || !showOnMobile) {
      return
    }

    attachLongPressEvents()

    return () => {
      cleanupLongPressEvents()
    }
  }, [attachLongPressEvents, cleanupLongPressEvents, isMobile, showOnMobile])

  const clickProps = isMobile
    ? {}
    : {
        onClick: () => tooltip.hide(),
      }

  useEffect(() => {
    const anchor = anchorRef.current
    if (!anchor) {
      return
    }

    const scrollParent = getScrollParent(anchor)
    if (!scrollParent) {
      return
    }

    const handleScroll = () => {
      tooltip.hide()
    }

    scrollParent.addEventListener('scroll', handleScroll)
    return () => {
      scrollParent.removeEventListener('scroll', handleScroll)
    }
  }, [tooltip])

  if (isMobile && !showOnMobile) {
    return <>{children}</>
  }

  return (
    <>
      <TooltipAnchor
        {...clickProps}
        onBlur={() => setForceOpen(undefined)}
        store={tooltip}
        render={<Slot ref={anchorRef} />}
        showOnHover={showOnHover}
      >
        {children}
      </TooltipAnchor>
      <Tooltip
        tabIndex={undefined}
        autoFocusOnShow={!showOnHover}
        store={tooltip}
        className={classNames(
          'z-tooltip max-w-max rounded border border-border bg-contrast px-3 py-1.5 text-sm text-foreground shadow [backdrop-filter:var(--popover-backdrop-filter)] translucent-ui:border-[--popover-border-color] translucent-ui:bg-[--popover-background-color]',
          'opacity-60 transition-opacity duration-75 [&[data-enter]]:opacity-100 [&[data-leave]]:opacity-60',
          'focus-visible:shadow-none focus-visible:outline-none',
          className,
        )}
        updatePosition={() => {
          const { popoverElement, anchorElement, open } = tooltip.getState()

          if (!interactive && popoverElement) {
            popoverElement.style.pointerEvents = 'none'
          }

          const documentElementForPopover = documentElement || document.querySelector('.main-ui-view')

          if (!popoverElement || !anchorElement || !documentElementForPopover || !open) {
            return
          }

          const anchorRect = anchorElement.getBoundingClientRect()
          const popoverRect = popoverElement.getBoundingClientRect()
          const documentRect = documentElementForPopover.getBoundingClientRect()

          const styles = getPositionedPopoverStyles({
            align: 'center',
            side: side || 'bottom',
            anchorRect,
            popoverRect,
            documentRect,
            disableMobileFullscreenTakeover: true,
            disableApplyingMobileWidth: true,
            offset: props.gutter ? props.gutter : 6,
          })

          if (!styles) {
            return
          }

          Object.assign(popoverElement.style, styles)

          if (!props.portal) {
            const adjustedStyles = getAdjustedStylesForNonPortalPopover(
              popoverElement,
              styles,
              props.portalElement instanceof HTMLElement ? props.portalElement : undefined,
            )
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

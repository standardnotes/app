import { useDocumentRect } from '@/Hooks/useDocumentRect'
import { useAutoElementRect } from '@/Hooks/useElementRect'
import { classNames } from '@standardnotes/utils'
import { CSSProperties, useCallback, useLayoutEffect, useState } from 'react'
import Portal from '../Portal/Portal'
import { PopoverCSSProperties, getPositionedPopoverStyles } from './GetPositionedPopoverStyles'
import { PopoverContentProps } from './Types'
import { usePopoverCloseOnClickOutside } from './Utils/usePopoverCloseOnClickOutside'
import { useDisableBodyScrollOnMobile } from '@/Hooks/useDisableBodyScrollOnMobile'
import { MediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'
import { KeyboardKey } from '@standardnotes/ui-services'
import { getAdjustedStylesForNonPortalPopover } from './Utils/getAdjustedStylesForNonPortal'
import { DialogWithClose } from '@/Utils/CloseOpenModalsAndPopovers'
import { mergeRefs } from '@/Hooks/mergeRefs'

const PositionedPopoverContent = ({
  align = 'end',
  anchorElement,
  anchorPoint,
  children,
  childPopovers,
  className,
  id,
  overrideZIndex,
  side = 'bottom',
  togglePopover,
  disableClickOutside,
  disableMobileFullscreenTakeover,
  maxHeight,
  portal = true,
  offset,
  hideOnClickInModal = false,
}: PopoverContentProps) => {
  const [popoverElement, setPopoverElement] = useState<HTMLDivElement | null>(null)
  const popoverRect = useAutoElementRect(popoverElement)
  const anchorElementRect = useAutoElementRect(anchorElement, {
    updateOnWindowResize: true,
  })
  const anchorPointRect = DOMRect.fromRect({
    x: anchorPoint?.x,
    y: anchorPoint?.y,
  })
  const anchorRect = anchorPoint ? anchorPointRect : anchorElementRect
  const documentRect = useDocumentRect()
  const isDesktopScreen = useMediaQuery(MediaQueryBreakpoints.md)

  const styles = getPositionedPopoverStyles({
    align,
    anchorRect,
    documentRect,
    popoverRect: popoverRect ?? popoverElement?.getBoundingClientRect(),
    side,
    disableMobileFullscreenTakeover: disableMobileFullscreenTakeover,
    maxHeightFunction: maxHeight,
    offset,
  })

  let adjustedStyles: PopoverCSSProperties | undefined = undefined

  if (!portal && popoverElement && styles) {
    adjustedStyles = getAdjustedStylesForNonPortalPopover(popoverElement, styles)
  }

  usePopoverCloseOnClickOutside({
    popoverElement,
    anchorElement,
    togglePopover,
    childPopovers,
    hideOnClickInModal,
    disabled: disableClickOutside,
  })

  useDisableBodyScrollOnMobile()

  const correctInitialScrollForOverflowedContent = useCallback(() => {
    if (popoverElement) {
      setTimeout(() => {
        popoverElement.scrollTop = 0
      }, 10)
    }
  }, [popoverElement])

  useLayoutEffect(() => {
    correctInitialScrollForOverflowedContent()
  }, [popoverElement, correctInitialScrollForOverflowedContent])

  const addCloseMethod = useCallback(
    (element: HTMLDivElement | null) => {
      if (element && togglePopover) {
        ;(element as DialogWithClose).close = togglePopover
      }
    },
    [togglePopover],
  )

  return (
    <Portal disabled={!portal}>
      <div
        className={classNames(
          'absolute left-0 top-0 flex w-full min-w-80 cursor-auto flex-col',
          'overflow-y-auto rounded border border-[--popover-border-color] bg-[--popover-background-color] shadow-main md:h-auto md:max-w-xs',
          !disableMobileFullscreenTakeover && 'h-full',
          overrideZIndex ? overrideZIndex : 'z-dropdown-menu',
          !isDesktopScreen && !disableMobileFullscreenTakeover ? 'pb-safe-bottom pt-safe-top' : '',
          isDesktopScreen || disableMobileFullscreenTakeover ? 'invisible' : '',
          className,
        )}
        style={
          {
            ...styles,
            ...adjustedStyles,
            backdropFilter: 'var(--popover-backdrop-filter)',
          } as CSSProperties
        }
        ref={mergeRefs([setPopoverElement, addCloseMethod])}
        data-popover={id}
        onKeyDown={(event) => {
          if (event.key === KeyboardKey.Escape) {
            event.stopPropagation()
            togglePopover?.()
            if (anchorElement) {
              anchorElement.focus()
            }
          }
        }}
      >
        {children}
      </div>
    </Portal>
  )
}

export default PositionedPopoverContent

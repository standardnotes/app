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

  return (
    <Portal disabled={!portal}>
      <div
        className={classNames(
          'absolute top-0 left-0 flex w-full min-w-80 cursor-auto flex-col',
          'overflow-y-auto rounded bg-default shadow-main md:h-auto md:max-w-xs',
          !disableMobileFullscreenTakeover && 'h-full',
          overrideZIndex ? overrideZIndex : 'z-dropdown-menu',
          !isDesktopScreen && !disableMobileFullscreenTakeover ? 'pt-safe-top pb-safe-bottom' : '',
          isDesktopScreen || disableMobileFullscreenTakeover ? 'invisible' : '',
          className,
        )}
        style={
          {
            ...styles,
            ...adjustedStyles,
          } as CSSProperties
        }
        ref={setPopoverElement}
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

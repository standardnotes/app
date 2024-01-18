import { useDocumentRect } from '@/Hooks/useDocumentRect'
import { useAutoElementRect } from '@/Hooks/useElementRect'
import { classNames } from '@standardnotes/utils'
import { CSSProperties, useCallback, useLayoutEffect, useRef, useState } from 'react'
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
  disableFlip,
  disableApplyingMobileWidth,
  maxHeight,
  portal = true,
  offset,
  hideOnClickInModal = false,
  setAnimationElement,
  containerClassName,
  documentElement,
}: PopoverContentProps) => {
  const [popoverElement, setPopoverElement] = useState<HTMLDivElement | null>(null)
  const popoverRect = useAutoElementRect(popoverElement)
  const resolvedAnchorElement = anchorElement && 'current' in anchorElement ? anchorElement.current : anchorElement
  const anchorElementRect = useAutoElementRect(resolvedAnchorElement, {
    updateOnWindowResize: true,
  })
  const anchorPointRect = DOMRect.fromRect({
    x: anchorPoint?.x,
    y: anchorPoint?.y,
  })
  const anchorRect = anchorPoint ? anchorPointRect : anchorElementRect
  const _documentRect = useDocumentRect()
  const isDesktopScreen = useMediaQuery(MediaQueryBreakpoints.md)

  const styles = getPositionedPopoverStyles({
    align,
    anchorRect,
    documentRect: documentElement?.getBoundingClientRect() ?? _documentRect,
    popoverRect: popoverRect ?? popoverElement?.getBoundingClientRect(),
    side,
    disableMobileFullscreenTakeover,
    disableFlip,
    disableApplyingMobileWidth,
    maxHeightFunction: maxHeight,
    offset,
  })

  if (!styles) {
    document.body.style.overflow = 'hidden'
  }

  useLayoutEffect(() => {
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  let adjustedStyles: PopoverCSSProperties | undefined = undefined

  if (!portal && popoverElement && styles) {
    adjustedStyles = getAdjustedStylesForNonPortalPopover(popoverElement, styles, documentElement)
  }

  usePopoverCloseOnClickOutside({
    popoverElement,
    anchorElement: resolvedAnchorElement,
    togglePopover,
    childPopovers,
    hideOnClickInModal,
    disabled: disableClickOutside,
  })

  useDisableBodyScrollOnMobile()

  const canCorrectInitialScroll = useRef(true)
  const correctInitialScrollForOverflowedContent = useCallback((element: HTMLElement | null) => {
    if (element && element.scrollTop > 0 && canCorrectInitialScroll.current) {
      element.scrollTop = 0
      canCorrectInitialScroll.current = false
    }
  }, [])

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
          'absolute left-0 top-0 flex w-full min-w-80 cursor-auto flex-col md:h-auto md:max-w-xs',
          !disableMobileFullscreenTakeover && 'h-full',
          overrideZIndex ? overrideZIndex : 'z-dropdown-menu',
          isDesktopScreen || disableMobileFullscreenTakeover ? 'invisible' : '',
          containerClassName,
        )}
        style={
          {
            ...styles,
            ...adjustedStyles,
          } as CSSProperties
        }
        ref={mergeRefs([setPopoverElement, addCloseMethod])}
        id={'popover/' + id}
        data-popover={id}
        onKeyDown={(event) => {
          if (event.key === KeyboardKey.Escape) {
            event.stopPropagation()
            togglePopover?.()
            if (resolvedAnchorElement) {
              resolvedAnchorElement.focus()
            }
          }
        }}
        onBlur={() => {
          setTimeout(() => {
            if (
              document.activeElement &&
              document.activeElement.tagName === 'IFRAME' &&
              !document.activeElement.getAttribute('data-used-in-modal')
            ) {
              togglePopover?.()
            }
          })
        }}
      >
        <div
          className={classNames(
            'overflow-y-auto rounded border border-[--popover-border-color] bg-default shadow-main [backdrop-filter:var(--popover-backdrop-filter)] md:bg-[--popover-background-color]',
            !isDesktopScreen && !disableMobileFullscreenTakeover ? 'pb-safe-bottom pt-safe-top' : '',
            'transition-[transform,opacity] duration-75 [transform-origin:var(--transform-origin)] motion-reduce:transition-opacity',
            styles ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
            className,
          )}
          ref={mergeRefs([correctInitialScrollForOverflowedContent, setAnimationElement])}
          onScroll={() => {
            canCorrectInitialScroll.current = false
          }}
        >
          {children}
        </div>
      </div>
    </Portal>
  )
}

export default PositionedPopoverContent

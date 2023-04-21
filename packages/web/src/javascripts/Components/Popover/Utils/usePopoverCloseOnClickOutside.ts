import { useEffect } from 'react'

type Options = {
  popoverElement: HTMLElement | null
  anchorElement: HTMLElement | null | undefined
  togglePopover?: () => void
  childPopovers: Set<string>
  disabled?: boolean
}

export const usePopoverCloseOnClickOutside = ({
  popoverElement,
  anchorElement,
  togglePopover,
  childPopovers,
  disabled,
}: Options) => {
  useEffect(() => {
    const closeIfClickedOutside = (event: MouseEvent) => {
      const target = event.target as Element

      const isDescendantOfMenu = popoverElement?.contains(target)
      const isAnchorElement = anchorElement ? anchorElement === event.target || anchorElement.contains(target) : false
      const closestPopoverId = target.closest('[data-popover]')?.getAttribute('data-popover')
      const isDescendantOfChildPopover = closestPopoverId && childPopovers.has(closestPopoverId)
      const isPopoverInModal = popoverElement?.closest('[data-dialog]')
      const isDescendantOfModal = isPopoverInModal ? false : !!target.closest('[data-dialog]')

      if (!isDescendantOfMenu && !isAnchorElement && !isDescendantOfChildPopover && !isDescendantOfModal) {
        if (!disabled) {
          togglePopover?.()
        }
      }
    }

    document.addEventListener('click', closeIfClickedOutside, { capture: true })
    document.addEventListener('contextmenu', closeIfClickedOutside, { capture: true })
    return () => {
      document.removeEventListener('click', closeIfClickedOutside, { capture: true })
      document.removeEventListener('contextmenu', closeIfClickedOutside, { capture: true })
    }
  }, [anchorElement, childPopovers, popoverElement, togglePopover, disabled])
}

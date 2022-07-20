import { useEffect } from 'react'

type Options = {
  popoverElement: HTMLElement | null
  anchorElement: HTMLElement | null | undefined
  togglePopover: () => void
}

export const usePopoverCloseOnClickOutside = ({ popoverElement, anchorElement, togglePopover }: Options) => {
  useEffect(() => {
    const closeIfClickedOutside = (event: MouseEvent) => {
      const matchesMediumBreakpoint = matchMedia('(min-width: 768px)').matches

      if (!matchesMediumBreakpoint) {
        return
      }

      const target = event.target as Element

      const isDescendantOfMenu = popoverElement?.contains(target)
      const isAnchorElement = anchorElement ? anchorElement === event.target || anchorElement.contains(target) : false
      const isDescendantOfPopover = target.closest('[data-popover]')

      if (!isDescendantOfMenu && !isAnchorElement && !isDescendantOfPopover) {
        togglePopover()
      }
    }

    document.addEventListener('click', closeIfClickedOutside, { capture: true })
    return () => {
      document.removeEventListener('click', closeIfClickedOutside, {
        capture: true,
      })
    }
  }, [anchorElement, popoverElement, togglePopover])
}

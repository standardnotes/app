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

      const isDescendantOfMenu = popoverElement?.contains(event.target as Node)
      const isAnchorElement = anchorElement
        ? (event.target as Node).isSameNode(anchorElement) || anchorElement.contains(event.target as Node)
        : false

      if (!isDescendantOfMenu && !isAnchorElement) {
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

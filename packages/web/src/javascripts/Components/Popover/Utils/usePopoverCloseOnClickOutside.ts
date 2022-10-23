import { MediaQueryBreakpoints } from '@/Hooks/useMediaQuery'
import { useEffect } from 'react'

type Options = {
  popoverElement: HTMLElement | null
  anchorElement: HTMLElement | null | undefined
  togglePopover: () => void
  childPopovers: Set<string>
}

export const usePopoverCloseOnClickOutside = ({
  popoverElement,
  anchorElement,
  togglePopover,
  childPopovers,
}: Options) => {
  useEffect(() => {
    const closeIfClickedOutside = (event: MouseEvent) => {
      const matchesMediumBreakpoint = matchMedia(MediaQueryBreakpoints.md).matches

      if (!matchesMediumBreakpoint) {
        return
      }

      const target = event.target as Element

      const isDescendantOfMenu = popoverElement?.contains(target)
      const isAnchorElement = anchorElement ? anchorElement === event.target || anchorElement.contains(target) : false
      const closestPopoverId = target.closest('[data-popover]')?.getAttribute('data-popover')
      const isDescendantOfChildPopover = closestPopoverId && childPopovers.has(closestPopoverId)
      const isDescendantOfChallengeModal = !!target.closest('.challenge-modal')

      if (!isDescendantOfMenu && !isAnchorElement && !isDescendantOfChildPopover && !isDescendantOfChallengeModal) {
        togglePopover()
      }
    }

    document.addEventListener('click', closeIfClickedOutside, { capture: true })
    document.addEventListener('contextmenu', closeIfClickedOutside, { capture: true })
    return () => {
      document.removeEventListener('click', closeIfClickedOutside, { capture: true })
      document.removeEventListener('contextmenu', closeIfClickedOutside, { capture: true })
    }
  }, [anchorElement, childPopovers, popoverElement, togglePopover])
}

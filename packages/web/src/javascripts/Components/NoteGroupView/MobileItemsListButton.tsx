import { AppPaneId } from '../ResponsivePane/AppPaneMetadata'
import Icon from '../Icon/Icon'
import { useResponsiveAppPane } from '../ResponsivePane/ResponsivePaneProvider'
import { useMediaQuery, MediaQueryBreakpoints } from '@/Hooks/useMediaQuery'
import { IconType } from '@standardnotes/icons'

const MobileItemsListButton = () => {
  const { toggleAppPane, isNotesListVisibleOnTablets, toggleNotesListOnTablets } = useResponsiveAppPane()
  const matchesMediumBreakpoint = useMediaQuery(MediaQueryBreakpoints.md)
  const matchesXLBreakpoint = useMediaQuery(MediaQueryBreakpoints.xl)
  const isTabletScreenSize = matchesMediumBreakpoint && !matchesXLBreakpoint

  const iconType: IconType = isTabletScreenSize && !isNotesListVisibleOnTablets ? 'chevron-right' : 'chevron-left'
  const label = isTabletScreenSize
    ? isNotesListVisibleOnTablets
      ? 'Hide items list'
      : 'Show items list'
    : 'Go to items list'

  return (
    <button
      className="bg-text-padding mr-3 flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-full border border-solid border-border text-neutral hover:bg-contrast focus:bg-contrast md:hidden pointer-coarse:md-only:flex pointer-coarse:lg-only:flex"
      onClick={() => {
        if (isTabletScreenSize) {
          toggleNotesListOnTablets()
        } else {
          toggleAppPane(AppPaneId.Items)
        }
      }}
      title={label}
      aria-label={label}
    >
      <Icon type={iconType} />
    </button>
  )
}

export default MobileItemsListButton

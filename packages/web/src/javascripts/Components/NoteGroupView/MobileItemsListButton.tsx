import { AppPaneId } from '../ResponsivePane/AppPaneMetadata'
import { useResponsiveAppPane } from '../ResponsivePane/ResponsivePaneProvider'
import { useMediaQuery, MediaQueryBreakpoints } from '@/Hooks/useMediaQuery'
import { IconType } from '@standardnotes/snjs'
import RoundIconButton from '../Button/RoundIconButton'

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
    <RoundIconButton
      className="mr-3"
      onClick={() => {
        if (isTabletScreenSize) {
          toggleNotesListOnTablets()
        } else {
          toggleAppPane(AppPaneId.Items)
        }
      }}
      label={label}
      icon={iconType}
    />
  )
}

export default MobileItemsListButton

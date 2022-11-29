import { AppPaneId } from '../ResponsivePane/AppPaneMetadata'
import { useResponsiveAppPane } from '../ResponsivePane/ResponsivePaneProvider'
import { classNames, IconType } from '@standardnotes/snjs'
import RoundIconButton from '../Button/RoundIconButton'
import useIsTabletOrMobileScreen from '@/Hooks/useIsTabletOrMobileScreen'

const MobileItemsListButton = () => {
  const { panes, replacePanes, dismissLastPane } = useResponsiveAppPane()

  const { isTablet, isTabletOrMobile, isMobile } = useIsTabletOrMobileScreen()

  const itemsShown = panes.includes(AppPaneId.Items)

  const iconType: IconType = isTablet && !itemsShown ? 'chevron-right' : 'chevron-left'

  const label = isTablet ? (itemsShown ? 'Hide items list' : 'Show items list') : 'Go to items list'

  return (
    <RoundIconButton
      className={classNames(isTabletOrMobile ? 'flex' : 'hidden', 'mr-3')}
      onClick={() => {
        if (itemsShown) {
          if (isMobile) {
            dismissLastPane()
          } else {
            replacePanes([AppPaneId.Editor])
          }
        } else {
          replacePanes([AppPaneId.Items, AppPaneId.Editor])
        }
      }}
      label={label}
      icon={iconType}
      iconClassName={'h-6 w-6'}
    />
  )
}

export default MobileItemsListButton

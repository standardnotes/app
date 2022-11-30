import { AppPaneId } from '../Panes/AppPaneMetadata'
import { useResponsiveAppPane } from '../Panes/ResponsivePaneProvider'
import { classNames, IconType } from '@standardnotes/snjs'
import RoundIconButton from '../Button/RoundIconButton'
import useIsTabletOrMobileScreen from '@/Hooks/useIsTabletOrMobileScreen'
import { PaneLayout } from '@/Controllers/PaneController/PaneLayout'

const MobileItemsListButton = () => {
  const { panes, replacePanes, setPaneLayout } = useResponsiveAppPane()

  const { isTablet, isTabletOrMobile, isMobile } = useIsTabletOrMobileScreen()

  const itemsShown = panes.includes(AppPaneId.Items)

  const iconType: IconType = isTablet && !itemsShown ? 'chevron-right' : 'chevron-left'

  const label = isTablet ? (itemsShown ? 'Hide items list' : 'Show items list') : 'Go to items list'

  return (
    <RoundIconButton
      className={classNames(isTabletOrMobile ? 'flex' : 'hidden', 'mr-3')}
      onClick={() => {
        if (isMobile) {
          void setPaneLayout(PaneLayout.ItemSelection)
        } else {
          if (itemsShown) {
            void replacePanes([AppPaneId.Editor])
          } else {
            void setPaneLayout(PaneLayout.ItemSelection)
          }
        }
      }}
      label={label}
      icon={iconType}
      iconClassName={'h-6 w-6'}
    />
  )
}

export default MobileItemsListButton

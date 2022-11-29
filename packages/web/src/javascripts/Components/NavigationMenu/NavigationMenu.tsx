import useIsTabletOrMobileScreen from '@/Hooks/useIsTabletOrMobileScreen'
import { classNames } from '@standardnotes/snjs'
import RoundIconButton from '../Button/RoundIconButton'
import { AppPaneId } from '../ResponsivePane/AppPaneMetadata'
import { useResponsiveAppPane } from '../ResponsivePane/ResponsivePaneProvider'

/** This button is displayed in the items list header */
export const NavigationMenuButton = () => {
  const { selectedPane, popToPane, replacePanes } = useResponsiveAppPane()
  const { isTabletOrMobile, isMobile } = useIsTabletOrMobileScreen()

  return (
    <RoundIconButton
      className={classNames(isTabletOrMobile ? 'flex' : 'hidden', 'mr-3')}
      onClick={() => {
        if (selectedPane === AppPaneId.Editor) {
          replacePanes([AppPaneId.Navigation, AppPaneId.Items])
        } else if (selectedPane === AppPaneId.Items) {
          if (isMobile) {
            popToPane(AppPaneId.Navigation)
          }
        }
      }}
      label="Open navigation menu"
      icon="menu-variant"
    />
  )
}

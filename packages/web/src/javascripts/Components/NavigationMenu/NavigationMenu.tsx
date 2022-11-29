import { PaneLayout } from '@/Controllers/PaneLayout'
import useIsTabletOrMobileScreen from '@/Hooks/useIsTabletOrMobileScreen'
import { classNames } from '@standardnotes/snjs'
import RoundIconButton from '../Button/RoundIconButton'
import { useResponsiveAppPane } from '../ResponsivePane/ResponsivePaneProvider'

/** This button is displayed in the items list header */
export const NavigationMenuButton = () => {
  const { setPaneLayout } = useResponsiveAppPane()
  const { isTabletOrMobile } = useIsTabletOrMobileScreen()

  return (
    <RoundIconButton
      className={classNames(isTabletOrMobile ? 'flex' : 'hidden', 'mr-3')}
      onClick={() => {
        setPaneLayout(PaneLayout.TagSelection)
      }}
      label="Open navigation menu"
      icon="menu-variant"
    />
  )
}

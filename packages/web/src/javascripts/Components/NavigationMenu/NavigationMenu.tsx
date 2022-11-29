import RoundIconButton from '../Button/RoundIconButton'
import { AppPaneId } from '../ResponsivePane/AppPaneMetadata'
import { useResponsiveAppPane } from '../ResponsivePane/ResponsivePaneProvider'

export const NavigationMenuButton = () => {
  const { selectedPane, toggleAppPane, popToPane } = useResponsiveAppPane()

  return (
    <RoundIconButton
      className="mr-3 md:hidden pointer-coarse:md-only:flex pointer-coarse:lg-only:flex"
      onClick={() => {
        if (selectedPane === AppPaneId.Items || selectedPane === AppPaneId.Editor) {
          popToPane(AppPaneId.Navigation)
        } else {
          toggleAppPane(AppPaneId.Items)
        }
      }}
      label="Open navigation menu"
      icon="menu-variant"
    />
  )
}

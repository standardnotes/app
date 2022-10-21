import RoundIconButton from '../Button/RoundIconButton'
import { AppPaneId } from '../ResponsivePane/AppPaneMetadata'
import { useResponsiveAppPane } from '../ResponsivePane/ResponsivePaneProvider'

export const NavigationMenuButton = () => {
  const { selectedPane, toggleAppPane } = useResponsiveAppPane()

  return (
    <RoundIconButton
      className="mr-3 md:hidden"
      onClick={() => {
        if (selectedPane === AppPaneId.Items || selectedPane === AppPaneId.Editor) {
          toggleAppPane(AppPaneId.Navigation)
        } else {
          toggleAppPane(AppPaneId.Items)
        }
      }}
      label="Open navigation menu"
      icon="menu-variant"
    />
  )
}

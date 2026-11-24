import { TOGGLE_LIST_PANE_KEYBOARD_COMMAND, TOGGLE_NAVIGATION_PANE_KEYBOARD_COMMAND } from '@standardnotes/ui-services'
import { c } from 'ttag'
import { observer } from 'mobx-react-lite'
import { useResponsiveAppPane } from '../Panes/ResponsivePaneProvider'
import { useKeyboardService } from '../KeyboardServiceProvider'
import MenuSwitchButtonItem from '../Menu/MenuSwitchButtonItem'
import { useKeyboardShortcut } from '@/Hooks/useKeyboardShortcut'

const PanelSettingsSection = () => {
  const { isListPaneCollapsed, isNavigationPaneCollapsed, toggleListPane, toggleNavigationPane } =
    useResponsiveAppPane()

  const keyboardService = useKeyboardService()

  const navigationShortcut = useKeyboardShortcut(keyboardService, TOGGLE_NAVIGATION_PANE_KEYBOARD_COMMAND)

  const listShortcut = useKeyboardShortcut(keyboardService, TOGGLE_LIST_PANE_KEYBOARD_COMMAND)

  return (
    <div className="hidden md:block pointer-coarse:md-only:hidden pointer-coarse:lg-only:hidden">
      <MenuSwitchButtonItem
        className="items-center"
        checked={!isNavigationPaneCollapsed}
        onChange={toggleNavigationPane}
        shortcut={navigationShortcut}
      >
        {c('B2.NavSharedUI.Label').t`Show Tags Panel`}
      </MenuSwitchButtonItem>
      <MenuSwitchButtonItem
        className="items-center"
        checked={!isListPaneCollapsed}
        onChange={toggleListPane}
        shortcut={listShortcut}
      >
        {c('B2.NavSharedUI.Label').t`Show Notes Panel`}
      </MenuSwitchButtonItem>
    </div>
  )
}
export default observer(PanelSettingsSection)

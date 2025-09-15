import { TOGGLE_LIST_PANE_KEYBOARD_COMMAND, TOGGLE_NAVIGATION_PANE_KEYBOARD_COMMAND } from '@standardnotes/ui-services'
import { useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import { useResponsiveAppPane } from '../Panes/ResponsivePaneProvider'
import { useKeyboardService } from '../KeyboardServiceProvider'
import MenuSwitchButtonItem from '../Menu/MenuSwitchButtonItem'

const PanelSettingsSection = () => {
  const { isListPaneCollapsed, isNavigationPaneCollapsed, toggleListPane, toggleNavigationPane } =
    useResponsiveAppPane()

  const keyboardService = useKeyboardService()

  const navigationShortcut = useMemo(
    () => keyboardService.keyboardShortcutForCommand(TOGGLE_NAVIGATION_PANE_KEYBOARD_COMMAND),
    [keyboardService],
  )

  const listShortcut = useMemo(
    () => keyboardService.keyboardShortcutForCommand(TOGGLE_LIST_PANE_KEYBOARD_COMMAND),
    [keyboardService],
  )

  return (
    <div className="hidden md:block pointer-coarse:md-only:hidden pointer-coarse:lg-only:hidden">
      <MenuSwitchButtonItem
        className="items-center"
        checked={!isNavigationPaneCollapsed}
        onChange={toggleNavigationPane}
        shortcut={navigationShortcut}
      >
        Show Tags Panel
      </MenuSwitchButtonItem>
      <MenuSwitchButtonItem
        className="items-center"
        checked={!isListPaneCollapsed}
        onChange={toggleListPane}
        shortcut={listShortcut}
      >
        Show Notes Panel
      </MenuSwitchButtonItem>
    </div>
  )
}
export default observer(PanelSettingsSection)

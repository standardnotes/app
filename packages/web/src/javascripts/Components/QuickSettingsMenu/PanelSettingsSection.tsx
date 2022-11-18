import { TOGGLE_LIST_PANE_KEYBOARD_COMMAND, TOGGLE_NAVIGATION_PANE_KEYBOARD_COMMAND } from '@standardnotes/ui-services'
import { useMemo } from 'react'
import MenuItem from '../Menu/MenuItem'
import { MenuItemType } from '../Menu/MenuItemType'
import { observer } from 'mobx-react-lite'
import { useResponsiveAppPane } from '../ResponsivePane/ResponsivePaneProvider'
import { useCommandService } from '../ApplicationView/CommandProvider'

const PanelSettingsSection = () => {
  const { isListPaneCollapsed, isNavigationPaneCollapsed, toggleListPane, toggleNavigationPane } =
    useResponsiveAppPane()

    console.log('rerendering settings')

  const commandService = useCommandService()

  const navigationShortcut = useMemo(
    () => commandService.keyboardShortcutForCommand(TOGGLE_NAVIGATION_PANE_KEYBOARD_COMMAND),
    [commandService],
  )

  const listShortcut = useMemo(
    () => commandService.keyboardShortcutForCommand(TOGGLE_LIST_PANE_KEYBOARD_COMMAND),
    [commandService],
  )

  return (
    <div className="hidden md:block pointer-coarse:md-only:hidden pointer-coarse:lg-only:hidden">
      <MenuItem
        type={MenuItemType.SwitchButton}
        className="py-1 hover:bg-contrast focus:bg-info-backdrop"
        checked={isNavigationPaneCollapsed}
        onChange={toggleNavigationPane}
        shortcut={navigationShortcut}
      >
        Show navigation panel
      </MenuItem>
      <MenuItem
        type={MenuItemType.SwitchButton}
        className="py-1 hover:bg-contrast focus:bg-info-backdrop"
        checked={isListPaneCollapsed}
        onChange={toggleListPane}
        shortcut={listShortcut}
      >
        Show list panel
      </MenuItem>
    </div>
  )
}
export default observer(PanelSettingsSection)

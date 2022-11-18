import { WebApplication } from '@/Application/Application'
import { TOGGLE_LIST_PANE_KEYBOARD_COMMAND, TOGGLE_NAVIGATION_PANE_KEYBOARD_COMMAND } from '@standardnotes/ui-services'
import { memo, useMemo } from 'react'
import MenuItem from '../Menu/MenuItem'
import { MenuItemType } from '../Menu/MenuItemType'

type Props = {
  application: WebApplication
}

const PanelSettingsSection = ({ application }: Props) => {
  const navigationShortcut = useMemo(
    () => application.keyboardService.keyboardShortcutForCommand(TOGGLE_NAVIGATION_PANE_KEYBOARD_COMMAND),
    [application],
  )
  const listShortcut = useMemo(
    () => application.keyboardService.keyboardShortcutForCommand(TOGGLE_LIST_PANE_KEYBOARD_COMMAND),
    [application],
  )

  return (
    <div className="hidden md:block pointer-coarse:md-only:hidden pointer-coarse:lg-only:hidden">
      <MenuItem
        type={MenuItemType.SwitchButton}
        className="py-1 hover:bg-contrast focus:bg-info-backdrop"
        checked={application.paneController.isNavigationPaneCollapsed}
        onChange={application.paneController.toggleNavigationPane}
        shortcut={navigationShortcut}
      >
        Show navigation panel
      </MenuItem>
      <MenuItem
        type={MenuItemType.SwitchButton}
        className="py-1 hover:bg-contrast focus:bg-info-backdrop"
        checked={application.paneController.isListPaneCollapsed}
        onChange={application.paneController.toggleListPane}
        shortcut={listShortcut}
      >
        Show list panel
      </MenuItem>
    </div>
  )
}
export default memo(PanelSettingsSection)

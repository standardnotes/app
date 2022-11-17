import { WebApplication } from '@/Application/Application'
import { memo } from 'react'
import MenuItem from '../Menu/MenuItem'
import { MenuItemType } from '../Menu/MenuItemType'

type Props = {
  application: WebApplication
}

const PanelSettingsSection = ({ application }: Props) => {
  return (
    <div className="hidden md:block pointer-coarse:md-only:hidden pointer-coarse:lg-only:hidden">
      <MenuItem
        type={MenuItemType.SwitchButton}
        className="py-1 hover:bg-contrast focus:bg-info-backdrop"
        checked={application.paneController.isNavigationPaneCollapsed}
        onChange={application.paneController.toggleNavigationPane}
      >
        Show navigation panel
      </MenuItem>
      <MenuItem
        type={MenuItemType.SwitchButton}
        className="py-1 hover:bg-contrast focus:bg-info-backdrop"
        checked={application.paneController.isListPaneCollapsed}
        onChange={application.paneController.toggleListPane}
      >
        Show list panel
      </MenuItem>
    </div>
  )
}
export default memo(PanelSettingsSection)

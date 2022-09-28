import { WebApplication } from '@/Application/Application'
import { classNames } from '@/Utils/ConcatenateClassNames'
import { useRef, useState } from 'react'
import { PrefKey } from '@standardnotes/snjs'
import Icon from '../Icon/Icon'
import MenuItem from '../Menu/MenuItem'
import { MenuItemType } from '../Menu/MenuItemType'
import Popover from '../Popover/Popover'
import StyledTooltip from '../StyledTooltip/StyledTooltip'
import { PANEL_NAME_NAVIGATION, PANEL_NAME_NOTES } from '@/Constants/Constants'

type Props = {
  application: WebApplication
}

const WidthForCollapsedPanel = 5
const MinimumNavPanelWidth = 220
const MinimumNotesPanelWidth = 350

const PanelSettingsButton = ({ application }: Props) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const currentNavPanelWidth = application.getPreference(PrefKey.TagsPanelWidth, MinimumNavPanelWidth)
  const currentItemsPanelWidth = application.getPreference(PrefKey.NotesPanelWidth, MinimumNotesPanelWidth)
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => setIsOpen((open) => !open)

  const toggleNavigationPanel = () => {
    const isCollapsed = currentNavPanelWidth <= WidthForCollapsedPanel
    if (isCollapsed) {
      void application.setPreference(PrefKey.TagsPanelWidth, MinimumNavPanelWidth)
    } else {
      void application.setPreference(PrefKey.TagsPanelWidth, WidthForCollapsedPanel)
    }
    application.publishPanelDidResizeEvent(PANEL_NAME_NAVIGATION, !isCollapsed)
  }

  const toggleItemsListPanel = () => {
    const isCollapsed = currentItemsPanelWidth <= WidthForCollapsedPanel
    if (isCollapsed) {
      void application.setPreference(PrefKey.NotesPanelWidth, MinimumNotesPanelWidth)
    } else {
      void application.setPreference(PrefKey.NotesPanelWidth, WidthForCollapsedPanel)
    }
    application.publishPanelDidResizeEvent(PANEL_NAME_NOTES, !isCollapsed)
  }

  return (
    <>
      <StyledTooltip label="Open panel settings">
        <button
          ref={buttonRef}
          onClick={toggleMenu}
          className={classNames(
            isOpen ? 'bg-border' : '',
            'flex h-full w-8 cursor-pointer items-center justify-center rounded-full',
          )}
        >
          <Icon type="view" className="h-5 w-5 hover:text-info" />
        </button>
      </StyledTooltip>
      <Popover
        togglePopover={toggleMenu}
        anchorElement={buttonRef.current}
        open={isOpen}
        side="top"
        align="start"
        className="py-2 text-sm"
      >
        <div className="my-1 px-3 text-sm font-semibold uppercase text-text">Panel Settings</div>
        <MenuItem
          type={MenuItemType.SwitchButton}
          className="py-1 hover:bg-contrast focus:bg-info-backdrop"
          checked={currentNavPanelWidth > WidthForCollapsedPanel}
          onChange={toggleNavigationPanel}
        >
          Show navigation panel
        </MenuItem>
        <MenuItem
          type={MenuItemType.SwitchButton}
          className="py-1 hover:bg-contrast focus:bg-info-backdrop"
          checked={currentItemsPanelWidth > WidthForCollapsedPanel}
          onChange={toggleItemsListPanel}
        >
          Show items list panel
        </MenuItem>
      </Popover>
    </>
  )
}
export default PanelSettingsButton

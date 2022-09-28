import { WebApplication } from '@/Application/Application'
import { memo, useEffect, useState } from 'react'
import { ApplicationEvent, PrefKey } from '@standardnotes/snjs'
import MenuItem from '../Menu/MenuItem'
import { MenuItemType } from '../Menu/MenuItemType'
import { PANEL_NAME_NAVIGATION, PANEL_NAME_NOTES } from '@/Constants/Constants'
import HorizontalSeparator from '../Shared/HorizontalSeparator'

type Props = {
  application: WebApplication
}

const WidthForCollapsedPanel = 5
const MinimumNavPanelWidth = 220
const MinimumNotesPanelWidth = 350

const PanelSettingsSection = ({ application }: Props) => {
  const [currentNavPanelWidth, setCurrentNavPanelWidth] = useState(
    application.getPreference(PrefKey.TagsPanelWidth, MinimumNavPanelWidth),
  )

  const [currentItemsPanelWidth, setCurrentItemsPanelWidth] = useState(
    application.getPreference(PrefKey.NotesPanelWidth, MinimumNotesPanelWidth),
  )

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

  useEffect(() => {
    const removeObserver = application.addEventObserver(async () => {
      setCurrentNavPanelWidth(application.getPreference(PrefKey.TagsPanelWidth, MinimumNavPanelWidth))
      setCurrentItemsPanelWidth(application.getPreference(PrefKey.NotesPanelWidth, MinimumNotesPanelWidth))
    }, ApplicationEvent.PreferencesChanged)

    return removeObserver
  }, [application])

  return (
    <div className="hidden text-sm md:block">
      <HorizontalSeparator classes="my-2" />
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
    </div>
  )
}
export default memo(PanelSettingsSection)

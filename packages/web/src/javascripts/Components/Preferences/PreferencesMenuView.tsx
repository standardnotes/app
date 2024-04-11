import { observer } from 'mobx-react-lite'
import { FunctionComponent, useMemo } from 'react'
import Dropdown from '../Dropdown/Dropdown'
import { DropdownItem } from '../Dropdown/DropdownItem'
import PreferencesMenuItem from './PreferencesComponents/MenuItem'
import { PreferencesSessionController } from './Controller/PreferencesSessionController'
import { PreferencePaneId } from '@standardnotes/services'

type Props = {
  menu: PreferencesSessionController
}

const PreferencesMenuView: FunctionComponent<Props> = ({ menu }) => {
  const { selectedPaneId, selectPane, menuItems } = menu

  const dropdownMenuItems: DropdownItem[] = useMemo(
    () =>
      menuItems.map((menuItem) => ({
        icon: menuItem.icon,
        label: menuItem.label,
        value: menuItem.id,
      })),
    [menuItems],
  )

  return (
    <div className="border-b border-border bg-default px-5 py-2 md:border-0 md:bg-[--preferences-background-color] md:px-0 md:py-0">
      <div className="hidden min-w-55 flex-col overflow-y-auto px-3 py-6 md:flex">
        {menuItems.map((pref) => (
          <PreferencesMenuItem
            key={pref.id}
            iconType={pref.icon}
            label={pref.label}
            selected={pref.selected}
            bubbleCount={pref.bubbleCount}
            hasErrorIndicator={pref.hasErrorIndicator}
            onClick={() => {
              selectPane(pref.id)
            }}
          />
        ))}
      </div>
      <div className="md:hidden">
        <Dropdown
          items={dropdownMenuItems}
          label="Preferences Menu"
          value={selectedPaneId}
          onChange={(paneId) => {
            selectPane(paneId as PreferencePaneId)
          }}
          classNameOverride={{
            wrapper: 'relative',
            button: 'focus:outline-none focus:shadow-none focus:ring-none',
          }}
          popoverPlacement="bottom"
        />
      </div>
    </div>
  )
}

export default observer(PreferencesMenuView)

import { observer } from 'mobx-react-lite'
import { FunctionComponent, useMemo } from 'react'
import Dropdown from '../Dropdown/Dropdown'
import { DropdownItem } from '../Dropdown/DropdownItem'
import PreferencesMenuItem from './PreferencesComponents/MenuItem'
import { PreferencesMenu } from './PreferencesMenu'
import { PreferenceId } from '@standardnotes/ui-services'
import { classNames } from '@standardnotes/snjs'
import { useAvailableSafeAreaPadding } from '@/Hooks/useSafeAreaPadding'

type Props = {
  menu: PreferencesMenu
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

  const { hasBottomInset } = useAvailableSafeAreaPadding()

  return (
    <div
      className={classNames(
        'border-b border-border bg-default px-5 pt-2 md:border-0 md:bg-contrast md:px-0 md:py-0',
        hasBottomInset ? 'pb-safe-bottom' : 'pb-2 md:pb-0',
      )}
    >
      <div className="hidden min-w-55 flex-col overflow-y-auto px-3 py-6 md:flex">
        {menuItems.map((pref) => (
          <PreferencesMenuItem
            key={pref.id}
            iconType={pref.icon}
            label={pref.label}
            selected={pref.selected}
            hasBubble={pref.hasBubble}
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
            selectPane(paneId as PreferenceId)
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

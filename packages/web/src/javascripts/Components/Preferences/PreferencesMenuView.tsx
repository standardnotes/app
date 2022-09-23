import { observer } from 'mobx-react-lite'
import { FunctionComponent, useMemo } from 'react'
import styled from 'styled-components'
import Dropdown from '../Dropdown/Dropdown'
import { DropdownItem } from '../Dropdown/DropdownItem'
import PreferencesMenuItem from './PreferencesComponents/MenuItem'
import { PreferenceId, PreferencesMenu } from './PreferencesMenu'

type Props = {
  menu: PreferencesMenu
}

const StyledDropdown = styled(Dropdown)`
  [data-reach-listbox-button] {
    background: var(--sn-stylekit-contrast-background-color);
    color: var(--sn-stylekit-info-color);
    font-weight: bold;
    padding: 0.55rem 0.875rem;

    [data-reach-listbox-arrow] svg {
      fill: var(--sn-stylekit-info-color);
    }
  }
`

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
    <div className="border-t border-border bg-default px-5 pt-2 md:border-0 md:bg-contrast md:px-0 md:py-0">
      <div className="hidden min-w-55 flex-col overflow-y-auto px-3 py-6 md:flex">
        {menuItems.map((pref) => (
          <PreferencesMenuItem
            key={pref.id}
            iconType={pref.icon}
            label={pref.label}
            selected={pref.selected}
            hasBubble={pref.hasBubble}
            onClick={() => selectPane(pref.id)}
          />
        ))}
      </div>
      <div className="md:hidden">
        <StyledDropdown
          id="preferences-menu"
          items={dropdownMenuItems}
          label="Preferences Menu"
          value={selectedPaneId}
          onChange={(paneId) => {
            selectPane(paneId as PreferenceId)
          }}
        />
      </div>
    </div>
  )
}

export default observer(PreferencesMenuView)

import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import Menu from '../Menu/Menu'
import RadioButtonGroup from '@/Components/RadioButtonGroup/RadioButtonGroup'
import ManyVaultSelectionMenu from './ManyVaultSelectionMenu'
import SingleVaultSelectionMenu from './SingleVaultSelectionMenu'
import { useApplication } from '../ApplicationProvider'
import MenuItemSeparator from '../Menu/MenuItemSeparator'
import MenuItem from '../Menu/MenuItem'

type SettingsMode = 'many' | 'single'

const VaultSelectionMenu = () => {
  const application = useApplication()

  const [mode, setMode] = useState<SettingsMode>(
    application.vaultDisplayService.isInExclusiveDisplayMode() ? 'single' : 'many',
  )

  const changeSelectionMode = (mode: SettingsMode) => {
    setMode(mode)

    if (mode === 'many') {
      if (application.vaultDisplayService.exclusivelyShownVault) {
        application.vaultDisplayService.changeToMultipleVaultDisplayMode()
      }
    }
  }

  return (
    <Menu a11yLabel="Vault selection menu">
      <RadioButtonGroup
        items={[
          { label: 'Multiple', value: 'many' },
          { label: 'One', value: 'single' },
        ]}
        value={mode}
        onChange={(value) => changeSelectionMode(value)}
        className="m-3 mt-1"
      />
      {mode === 'many' && <ManyVaultSelectionMenu />}
      {mode === 'single' && <SingleVaultSelectionMenu />}
      <MenuItemSeparator />
      <MenuItem
        icon="settings"
        onClick={() => {
          application.preferencesController.openPreferences('vaults')
        }}
      >
        Open vault settings
      </MenuItem>
    </Menu>
  )
}

export default observer(VaultSelectionMenu)

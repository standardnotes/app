import { observer } from 'mobx-react-lite'
import { FunctionComponent, useState } from 'react'
import Menu from '../Menu/Menu'
import { VaultSelectionController } from '@/Controllers/VaultSelectionController'
import RadioButtonGroup from '@/Components/RadioButtonGroup/RadioButtonGroup'
import ManyVaultSelectionMenu from './ManyVaultSelectionMenu'
import SingleVaultSelectionMenu from './SingleVaultSelectionMenu'
import { useApplication } from '../ApplicationProvider'

type MenuProps = {
  controller: VaultSelectionController
}

type SettingsMode = 'many' | 'single'

const VaultSelectionMenu: FunctionComponent<MenuProps> = () => {
  const application = useApplication()

  const [mode, setMode] = useState<SettingsMode>(
    application.vaultDisplayService.getOptions().exclusive ? 'single' : 'many',
  )

  return (
    <Menu a11yLabel="Vault selection menu" isOpen>
      <RadioButtonGroup
        items={[
          { label: 'Multiple', value: 'many' },
          { label: 'One', value: 'single' },
        ]}
        value={mode}
        onChange={(value) => setMode(value as SettingsMode)}
        className="m-3 mt-1"
      />

      {mode === 'many' && <ManyVaultSelectionMenu />}
      {mode === 'single' && <SingleVaultSelectionMenu />}
    </Menu>
  )
}

export default observer(VaultSelectionMenu)

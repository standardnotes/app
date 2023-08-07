import { FunctionComponent, useCallback } from 'react'
import Menu from '../Menu/Menu'
import { useApplication } from '../ApplicationProvider'
import { VaultListingInterface } from '@standardnotes/snjs'
import MenuRadioButtonItem from '../Menu/MenuRadioButtonItem'
import { observer } from 'mobx-react-lite'
import Icon from '../Icon/Icon'

const SingleVaultSelectionMenu: FunctionComponent = () => {
  const application = useApplication()
  const vaults = application.vaults.getVaults()

  const isVaultVisible = useCallback(
    (vault: VaultListingInterface) => {
      return application.vaultDisplayService.isVaultExclusivelyShown(vault)
    },
    [application],
  )

  const selectVault = useCallback(
    (vault: VaultListingInterface) => {
      application.vaultDisplayService.showOnlyVault(vault)
    },
    [application],
  )

  return (
    <Menu a11yLabel="Vault selection menu" isOpen>
      {!vaults.length && <div className="text-center py-1">No vaults found</div>}
      {vaults.map((vault) => (
        <MenuRadioButtonItem key={vault.uuid} checked={isVaultVisible(vault)} onClick={() => selectVault(vault)}>
          <div className="flex w-full items-center gap-1">
            {vault.name}
            {application.vaultLocks.isVaultLocked(vault) && <Icon className="ml-1" type="lock" size={'small'} />}
          </div>
        </MenuRadioButtonItem>
      ))}
    </Menu>
  )
}

export default observer(SingleVaultSelectionMenu)

import { FunctionComponent, useCallback } from 'react'
import Menu from '../Menu/Menu'
import { useApplication } from '../ApplicationProvider'
import { VaultListingInterface } from '@standardnotes/snjs'
import MenuRadioButtonItem from '../Menu/MenuRadioButtonItem'
import { observer } from 'mobx-react-lite'

const SingleVaultSelectionMenu: FunctionComponent = () => {
  const application = useApplication()
  const vaults = application.vaults.getVaults()
  const itemListController = application.getViewControllerManager().itemListController

  const isVaultVisible = useCallback(
    (vault: VaultListingInterface) => {
      return itemListController.isVaultExclusivelyShown(vault)
    },
    [itemListController],
  )

  const selectVault = useCallback(
    (vault: VaultListingInterface) => {
      itemListController.showOnlyVault(vault)
    },
    [itemListController],
  )

  return (
    <Menu a11yLabel="Vault selection menu" isOpen>
      {vaults.map((vault) => (
        <MenuRadioButtonItem key={vault.uuid} checked={isVaultVisible(vault)} onClick={() => selectVault(vault)}>
          {vault.name}
        </MenuRadioButtonItem>
      ))}
    </Menu>
  )
}

export default observer(SingleVaultSelectionMenu)

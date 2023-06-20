import { FunctionComponent, useCallback } from 'react'
import Menu from '../Menu/Menu'
import { useApplication } from '../ApplicationProvider'
import MenuSwitchButtonItem from '../Menu/MenuSwitchButtonItem'
import Icon from '../Icon/Icon'
import { VaultListingInterface } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'

const ManyVaultSelectionMenu: FunctionComponent = () => {
  const application = useApplication()
  const vaults = application.vaults.getVaults()

  const { isVaultExplicitelyExcluded, hideVault, unhideVault } =
    application.getViewControllerManager().itemListController

  const isVaultVisible = useCallback(
    (vault: VaultListingInterface) => {
      return !isVaultExplicitelyExcluded(vault)
    },
    [isVaultExplicitelyExcluded],
  )

  const toggleVault = useCallback(
    (vault: VaultListingInterface) => {
      if (isVaultVisible(vault)) {
        hideVault(vault)
      } else {
        unhideVault(vault)
      }
    },
    [isVaultVisible, hideVault, unhideVault],
  )

  return (
    <Menu a11yLabel="Vault selection menu" isOpen>
      {vaults.map((vault) => (
        <MenuSwitchButtonItem
          onChange={() => {
            toggleVault(vault)
          }}
          checked={isVaultVisible(vault)}
          key={vault.uuid}
        >
          <Icon type="safe-square" className="mr-2 text-neutral" />
          {vault.name}
        </MenuSwitchButtonItem>
      ))}
    </Menu>
  )
}

export default observer(ManyVaultSelectionMenu)

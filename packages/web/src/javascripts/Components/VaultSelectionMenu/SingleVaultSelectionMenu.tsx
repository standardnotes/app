import { FunctionComponent, useCallback, useEffect, useState } from 'react'
import Menu from '../Menu/Menu'
import { useApplication } from '../ApplicationProvider'
import { ContentType, VaultListingInterface } from '@standardnotes/snjs'
import MenuRadioButtonItem from '../Menu/MenuRadioButtonItem'
import { observer } from 'mobx-react-lite'
import Icon from '../Icon/Icon'
import VaultSelectMenuItemWithOptions from './MenuItemWithVaultOption'

const SingleVaultSelectionMenu: FunctionComponent = () => {
  const application = useApplication()

  const [vaults, setVaults] = useState(() => application.vaults.getVaults())
  useEffect(() => {
    return application.items.streamItems(ContentType.TYPES.VaultListing, () => {
      setVaults(application.vaults.getVaults())
    })
  }, [application.items, application.vaults])

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
    <Menu a11yLabel="Vault selection menu">
      {!vaults.length && <div className="py-1 text-center">No vaults found</div>}
      {vaults.map((vault) => (
        <VaultSelectMenuItemWithOptions vault={vault} key={vault.uuid}>
          <MenuRadioButtonItem
            className="!px-0 focus:!bg-transparent md:!py-[0.455rem]"
            key={vault.uuid}
            checked={isVaultVisible(vault)}
            onClick={() => selectVault(vault)}
          >
            {vault.name}
            {application.vaultLocks.isVaultLocked(vault) && <Icon className="ml-1" type="lock" size={'small'} />}
          </MenuRadioButtonItem>
        </VaultSelectMenuItemWithOptions>
      ))}
    </Menu>
  )
}

export default observer(SingleVaultSelectionMenu)

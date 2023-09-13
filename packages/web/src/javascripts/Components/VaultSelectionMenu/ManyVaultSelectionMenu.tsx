import { FunctionComponent, useCallback, useEffect, useState } from 'react'
import Menu from '../Menu/Menu'
import { useApplication } from '../ApplicationProvider'
import MenuSwitchButtonItem from '../Menu/MenuSwitchButtonItem'
import Icon from '../Icon/Icon'
import { ContentType, VaultListingInterface } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'

const ManyVaultSelectionMenu: FunctionComponent = () => {
  const application = useApplication()

  const [vaults, setVaults] = useState(() => application.vaults.getVaults())
  useEffect(() => {
    return application.items.streamItems(ContentType.TYPES.VaultListing, () => {
      setVaults(application.vaults.getVaults())
    })
  }, [application.items, application.vaults])

  const isVaultVisible = useCallback(
    (vault: VaultListingInterface) => {
      return !application.vaultDisplayService.isVaultDisabledOrLocked(vault)
    },
    [application],
  )

  const toggleVault = useCallback(
    (vault: VaultListingInterface) => {
      if (isVaultVisible(vault)) {
        application.vaultDisplayService.hideVault(vault)
      } else {
        application.vaultDisplayService.unhideVault(vault)
      }
    },
    [isVaultVisible, application],
  )

  return (
    <Menu a11yLabel="Vault selection menu" isOpen>
      {!vaults.length && <div className="py-1 text-center">No vaults found</div>}
      {vaults.map((vault) => (
        <MenuSwitchButtonItem
          onChange={() => {
            toggleVault(vault)
          }}
          checked={isVaultVisible(vault)}
          key={vault.uuid}
        >
          <Icon type={vault.iconString} className="mr-2 text-neutral" />
          <div className="flex w-full items-center gap-1">
            {vault.name}
            {application.vaultLocks.isVaultLocked(vault) && <Icon className="ml-1" type="lock" size={'small'} />}
          </div>
        </MenuSwitchButtonItem>
      ))}
    </Menu>
  )
}

export default observer(ManyVaultSelectionMenu)

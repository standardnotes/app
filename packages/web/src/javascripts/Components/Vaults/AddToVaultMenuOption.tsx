import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useRef, useState } from 'react'
import Icon from '@/Components/Icon/Icon'
import { KeyboardKey } from '@standardnotes/ui-services'
import Popover from '../Popover/Popover'
import { classNames, DecryptedItemInterface, VaultListingInterface } from '@standardnotes/snjs'
import { useApplication } from '../ApplicationProvider'
import MenuItem from '../Menu/MenuItem'
import Menu from '../Menu/Menu'
import { FeatureTrunkName, featureTrunkEnabled } from '@/FeatureTrunk'

type Props = {
  iconClassName: string
  items: DecryptedItemInterface[]
}

const AddToVaultMenuOption: FunctionComponent<Props> = ({ iconClassName, items }) => {
  const application = useApplication()
  const menuContainerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const vaults = application.vaults.getVaults()

  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false)

  const toggleSubMenu = useCallback(() => {
    setIsSubMenuOpen((isOpen) => !isOpen)
  }, [])

  const addItemsToVault = useCallback(
    async (vault: VaultListingInterface) => {
      if (application.vaults.isVaultLocked(vault)) {
        const unlocked = await application.vaultDisplayService.unlockVault(vault)
        if (!unlocked) {
          return
        }
      }

      for (const item of items) {
        await application.vaults.moveItemToVault(vault, item)
      }
    },
    [application.vaultDisplayService, application.vaults, items],
  )

  const removeItemsFromVault = useCallback(async () => {
    for (const item of items) {
      const vault = application.vaults.getItemVault(item)
      if (!vault) {
        continue
      }

      if (application.vaults.isVaultLocked(vault)) {
        const unlocked = await application.vaultDisplayService.unlockVault(vault)
        if (!unlocked) {
          return
        }
      }
      await application.vaults.removeItemFromVault(item)
    }
  }, [application.vaultDisplayService, application.vaults, items])

  const doesVaultContainItems = (vault: VaultListingInterface) => {
    return items.every((item) => item.key_system_identifier === vault.systemIdentifier)
  }

  const doSomeItemsBelongToVault = items.some((item) => application.vaults.isItemInVault(item))

  const singleItemVault = items.length === 1 ? application.vaults.getItemVault(items[0]) : undefined

  if (!featureTrunkEnabled(FeatureTrunkName.Vaults)) {
    return null
  }

  return (
    <div ref={menuContainerRef}>
      <MenuItem
        className="justify-between"
        onClick={toggleSubMenu}
        onKeyDown={(event) => {
          if (event.key === KeyboardKey.Escape) {
            setIsSubMenuOpen(false)
          }
        }}
        ref={buttonRef}
      >
        <div className="flex items-center">
          <Icon type="safe-square" className={iconClassName} />
          Move to vault
        </div>
        <Icon type="chevron-right" className="text-neutral" />
      </MenuItem>
      <Popover
        title="Move to vault"
        togglePopover={toggleSubMenu}
        anchorElement={buttonRef.current}
        open={isSubMenuOpen}
        side="right"
        align="start"
        className="py-2"
        overrideZIndex="z-modal"
      >
        <Menu a11yLabel="Vault selection menu" isOpen={isSubMenuOpen}>
          {doSomeItemsBelongToVault && (
            <MenuItem
              onClick={() => {
                void removeItemsFromVault()
              }}
            >
              <span className="flex overflow-hidden overflow-ellipsis whitespace-nowrap">
                <Icon type="close" className="mr-2 text-neutral" />
                <div className="flex w-full items-center gap-1">
                  Move out of {singleItemVault ? singleItemVault.name : 'vaults'}
                </div>
              </span>
            </MenuItem>
          )}
          {vaults.map((vault) => {
            if (singleItemVault) {
              return null
            }

            return (
              <MenuItem
                key={vault.uuid}
                onClick={() => {
                  doesVaultContainItems(vault) ? void removeItemsFromVault() : void addItemsToVault(vault)
                }}
              >
                <span
                  className={classNames(
                    'flex overflow-ellipsis whitespace-nowrap',
                    doesVaultContainItems(vault) ? 'font-bold' : '',
                  )}
                >
                  <Icon
                    type="safe-square"
                    size="large"
                    className={`mr-2 text-neutral ${doesVaultContainItems(vault) ? 'text-info' : ''}`}
                  />
                  <div className="flex w-full items-center">
                    {vault.name}
                    {application.vaults.isVaultLocked(vault) && <Icon className="ml-1" type="lock" size={'small'} />}
                  </div>
                </span>
              </MenuItem>
            )
          })}
        </Menu>
      </Popover>
    </div>
  )
}

export default observer(AddToVaultMenuOption)

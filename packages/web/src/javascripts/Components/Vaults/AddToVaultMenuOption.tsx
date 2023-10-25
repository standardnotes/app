import { observer } from 'mobx-react-lite'
import { useCallback, useRef, useState } from 'react'
import Icon from '@/Components/Icon/Icon'
import { KeyboardKey } from '@standardnotes/ui-services'
import Popover from '../Popover/Popover'
import { classNames, DecryptedItemInterface, VaultListingInterface } from '@standardnotes/snjs'
import { useApplication } from '../ApplicationProvider'
import MenuItem from '../Menu/MenuItem'
import Menu from '../Menu/Menu'

const VaultMenu = observer(({ items }: { items: DecryptedItemInterface[] }) => {
  const application = useApplication()
  const vaults = application.vaults.getVaults()

  const addItemsToVault = useCallback(
    async (vault: VaultListingInterface) => {
      if (application.vaultLocks.isVaultLocked(vault)) {
        const unlocked = await application.vaultDisplayService.unlockVault(vault)
        if (!unlocked) {
          return
        }
      }

      for (const item of items) {
        const result = await application.vaults.moveItemToVault(vault, item)
        if (result.isFailed()) {
          console.error(result.getError())
        }
      }
    },
    [application, items],
  )

  const removeItemsFromVault = useCallback(async () => {
    for (const item of items) {
      const vault = application.vaults.getItemVault(item)
      if (!vault) {
        continue
      }

      if (application.vaultLocks.isVaultLocked(vault)) {
        const unlocked = await application.vaultDisplayService.unlockVault(vault)
        if (!unlocked) {
          return
        }
      }
      await application.vaults.removeItemFromVault(item)
    }
  }, [application, items])

  const doesVaultContainItems = (vault: VaultListingInterface) => {
    return items.every((item) => item.key_system_identifier === vault.systemIdentifier)
  }

  const doSomeItemsBelongToVault = items.some((item) => application.vaults.isItemInVault(item))

  const singleItemVault = items.length === 1 ? application.vaults.getItemVault(items[0]) : undefined

  return (
    <Menu a11yLabel="Vault selection menu">
      {doSomeItemsBelongToVault && (
        <MenuItem
          onClick={() => {
            void removeItemsFromVault()
          }}
        >
          <Icon type="close" className="mr-2 text-neutral" />
          Move out of {singleItemVault ? singleItemVault.name : 'vaults'}
        </MenuItem>
      )}
      {!vaults.length && <div className="flex flex-col items-center justify-center py-1">No vaults found</div>}
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
            className={doesVaultContainItems(vault) ? 'font-bold' : ''}
            disabled={vault.isSharedVaultListing() && application.vaultUsers.isCurrentUserReadonlyVaultMember(vault)}
          >
            <Icon
              type={vault.iconString}
              size="custom"
              className={classNames(
                'mr-2 h-6 w-6 text-neutral md:h-5 md:w-5',
                doesVaultContainItems(vault) ? 'text-info' : '',
              )}
            />
            <div className="flex w-full items-center">
              {vault.name}
              {application.vaultLocks.isVaultLocked(vault) && <Icon className="ml-1" type="lock" size={'small'} />}
            </div>
          </MenuItem>
        )
      })}
    </Menu>
  )
})

const AddToVaultMenuOption = ({
  iconClassName,
  items,
  disabled,
}: {
  iconClassName: string
  items: DecryptedItemInterface[]
  disabled?: boolean
}) => {
  const application = useApplication()
  const buttonRef = useRef<HTMLButtonElement>(null)

  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false)

  const toggleSubMenu = useCallback(() => {
    setIsSubMenuOpen((isOpen) => !isOpen)
  }, [])

  if (!application.featuresController.isVaultsEnabled()) {
    return null
  }

  return (
    <>
      <MenuItem
        className="justify-between"
        onClick={toggleSubMenu}
        onKeyDown={(event) => {
          if (event.key === KeyboardKey.Escape) {
            setIsSubMenuOpen(false)
          }
        }}
        ref={buttonRef}
        disabled={disabled}
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
        anchorElement={buttonRef}
        open={isSubMenuOpen}
        side="right"
        align="start"
        className="py-2"
        overrideZIndex="z-modal"
      >
        <VaultMenu items={items} />
      </Popover>
    </>
  )
}

export default observer(AddToVaultMenuOption)

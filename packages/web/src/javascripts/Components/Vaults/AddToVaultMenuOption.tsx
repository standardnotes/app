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
        await application.vaults.moveItemToVault(vault, item)
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
    <Menu a11yLabel="Vault selection menu" isOpen={true}>
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
          >
            <span
              className={classNames(
                'flex overflow-ellipsis whitespace-nowrap',
                doesVaultContainItems(vault) ? 'font-bold' : '',
              )}
            >
              <Icon
                type={vault.iconString}
                size="large"
                className={classNames('mr-2 text-neutral', doesVaultContainItems(vault) ? 'text-info' : '')}
              />
              <div className="flex w-full items-center">
                {vault.name}
                {application.vaultLocks.isVaultLocked(vault) && <Icon className="ml-1" type="lock" size={'small'} />}
              </div>
            </span>
          </MenuItem>
        )
      })}
    </Menu>
  )
})

const AddToVaultMenuOption = ({ iconClassName, items }: { iconClassName: string; items: DecryptedItemInterface[] }) => {
  const application = useApplication()
  const buttonRef = useRef<HTMLButtonElement>(null)

  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false)

  const toggleSubMenu = useCallback(() => {
    setIsSubMenuOpen((isOpen) => !isOpen)
  }, [])

  if (!application.featuresController.isEntitledToVaults()) {
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

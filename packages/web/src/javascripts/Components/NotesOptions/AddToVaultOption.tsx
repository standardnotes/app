import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react'
import Icon from '@/Components/Icon/Icon'
import { KeyboardKey } from '@standardnotes/ui-services'
import Popover from '../Popover/Popover'
import { classNames, DecryptedItemInterface, VaultInterface, isClientDisplayableError } from '@standardnotes/snjs'
import { useApplication } from '../ApplicationProvider'
import MenuItem from '../Menu/MenuItem'
import Menu from '../Menu/Menu'

type Props = {
  iconClassName: string
  selectedItems: DecryptedItemInterface[]
}

const AddToVaultOption: FunctionComponent<Props> = ({ iconClassName, selectedItems }) => {
  const application = useApplication()
  const menuContainerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const [vaults, setVaults] = useState<VaultInterface[]>([])

  useEffect(() => {
    const reloadRemoteVaults = async () => {
      const vaults = await application.vaults.reloadRemoteVaults()
      if (!isClientDisplayableError(vaults)) {
        setVaults(vaults)
      }
    }
    setVaults(application.vaults.getVaults())
    void reloadRemoteVaults()
  }, [application.vaults])

  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = useCallback(() => {
    setIsOpen((isOpen) => !isOpen)
  }, [])

  const addItemsToVault = useCallback(
    async (vault: VaultInterface) => {
      for (const item of selectedItems) {
        await application.vaults.addItemToVault(vault, item)
      }
    },
    [application.vaults, selectedItems],
  )

  const removeItemsFromVault = useCallback(async () => {
    for (const item of selectedItems) {
      await application.vaults.moveItemFromVaultToUser(item)
    }
  }, [application.vaults, selectedItems])

  const doesVaultContainItems = (vault: VaultInterface) => {
    return selectedItems.every((item) => item.vault_uuid === vault.uuid)
  }

  return (
    <div ref={menuContainerRef}>
      <MenuItem
        className="justify-between"
        onClick={toggleMenu}
        onKeyDown={(event) => {
          if (event.key === KeyboardKey.Escape) {
            setIsOpen(false)
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
        togglePopover={toggleMenu}
        anchorElement={buttonRef.current}
        open={isOpen}
        side="right"
        align="start"
        className="py-2"
        overrideZIndex="z-modal"
      >
        <Menu a11yLabel="Vault selection menu" isOpen={isOpen}>
          {vaults.map((vault) => {
            const vaultData = application.vaults.getVaultInfo(vault.uuid)
            return (
              <MenuItem
                key={vault.uuid}
                onClick={() => {
                  doesVaultContainItems(vault) ? void removeItemsFromVault() : void addItemsToVault(vault)
                }}
              >
                <span
                  className={classNames(
                    'overflow-hidden overflow-ellipsis whitespace-nowrap',
                    doesVaultContainItems(vault) ? 'font-bold' : '',
                  )}
                >
                  {vaultData?.vaultName || vault.uuid}
                </span>
              </MenuItem>
            )
          })}
        </Menu>
      </Popover>
    </div>
  )
}

export default observer(AddToVaultOption)

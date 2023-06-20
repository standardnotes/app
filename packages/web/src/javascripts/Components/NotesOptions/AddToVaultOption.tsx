import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useRef, useState } from 'react'
import Icon from '@/Components/Icon/Icon'
import { KeyboardKey } from '@standardnotes/ui-services'
import Popover from '../Popover/Popover'
import { classNames, DecryptedItemInterface, VaultListingInterface } from '@standardnotes/snjs'
import { useApplication } from '../ApplicationProvider'
import MenuItem from '../Menu/MenuItem'
import Menu from '../Menu/Menu'

type Props = {
  iconClassName: string
  items: DecryptedItemInterface[]
}

const AddToVaultOption: FunctionComponent<Props> = ({ iconClassName, items }) => {
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
      for (const item of items) {
        await application.vaults.addItemToVault(vault, item)
      }
    },
    [application.vaults, items],
  )

  const removeItemsFromVault = useCallback(async () => {
    for (const item of items) {
      await application.vaults.removeItemFromVault(item)
    }
  }, [application.vaults, items])

  const doesVaultContainItems = (vault: VaultListingInterface) => {
    return items.every((item) => item.key_system_identifier === vault.systemIdentifier)
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
          {vaults.map((vault) => {
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
                  {vault.name || vault.systemIdentifier}
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

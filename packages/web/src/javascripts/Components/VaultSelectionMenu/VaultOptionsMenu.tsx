import { VaultListingInterface, VaultLockServiceEvent } from '@standardnotes/snjs'
import Menu from '../Menu/Menu'
import MenuItem from '../Menu/MenuItem'
import Icon from '../Icon/Icon'
import { useApplication } from '../ApplicationProvider'
import { useState, useEffect, useCallback } from 'react'
import EditVaultModal from '../Preferences/Panes/Vaults/Vaults/VaultModal/EditVaultModal'

type Props = {
  vault: VaultListingInterface
}

const VaultOptionsMenu = ({ vault }: Props) => {
  const application = useApplication()

  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false)

  const ensureVaultIsUnlocked = useCallback(async () => {
    if (!application.vaultLocks.isVaultLocked(vault)) {
      return true
    }
    const unlocked = await application.vaultDisplayService.unlockVault(vault)
    return unlocked
  }, [application, vault])

  const openEditModal = useCallback(async () => {
    if (!(await ensureVaultIsUnlocked())) {
      return
    }

    setIsVaultModalOpen(true)
  }, [ensureVaultIsUnlocked])

  const isVaultLockable = application.vaultLocks.isVaultLockable(vault)
  const [isVaultLocked, setIsVaultLocked] = useState(() => application.vaultLocks.isVaultLocked(vault))
  useEffect(() => {
    return application.vaultLocks.addEventObserver((event) => {
      if (event === VaultLockServiceEvent.VaultLocked || event === VaultLockServiceEvent.VaultUnlocked) {
        setIsVaultLocked(application.vaultLocks.isVaultLocked(vault))
      }
    })
  }, [application.vaultLocks, vault])
  const toggleLock = useCallback(async () => {
    if (!isVaultLockable) {
      return
    }
    if (isVaultLocked) {
      application.vaultDisplayService.unlockVault(vault).catch(console.error)
    } else {
      application.vaultLocks.lockNonPersistentVault(vault).catch(console.error)
    }
  }, [application.vaultDisplayService, application.vaultLocks, isVaultLockable, isVaultLocked, vault])

  return (
    <>
      <Menu a11yLabel="Vault options menu" isOpen>
        <MenuItem onClick={openEditModal}>
          <Icon type="pencil-filled" className="mr-2" />
          Edit vault
        </MenuItem>
        {isVaultLockable && (
          <MenuItem onClick={toggleLock}>
            <Icon type="lock" className="mr-2" />
            {isVaultLocked ? 'Unlock' : 'Lock'} vault
          </MenuItem>
        )}
      </Menu>
      <EditVaultModal
        vault={vault}
        isVaultModalOpen={isVaultModalOpen}
        closeVaultModal={() => setIsVaultModalOpen(false)}
      />
    </>
  )
}

export default VaultOptionsMenu

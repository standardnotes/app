import { useApplication } from '@/Components/ApplicationProvider'
import {
  KeySystemPasswordType,
  KeySystemRootKeyStorageMode,
  VaultListingInterface,
  VaultLockServiceEvent,
} from '@standardnotes/snjs'
import { useState, useEffect, useCallback } from 'react'

export const useVault = (vault: VaultListingInterface) => {
  const application = useApplication()

  const canShowLockOption =
    vault.keyPasswordType === KeySystemPasswordType.UserInputted &&
    vault.keyStorageMode === KeySystemRootKeyStorageMode.Ephemeral

  const [isLocked, setIsLocked] = useState(() => application.vaultLocks.isVaultLocked(vault))

  useEffect(() => {
    return application.vaultLocks.addEventObserver((event) => {
      if (event === VaultLockServiceEvent.VaultLocked || event === VaultLockServiceEvent.VaultUnlocked) {
        setIsLocked(application.vaultLocks.isVaultLocked(vault))
      }
    })
  }, [application.vaultLocks, vault])

  const toggleLock = useCallback(async () => {
    if (!canShowLockOption) {
      return
    }

    if (isLocked) {
      application.vaultDisplayService.unlockVault(vault).catch(console.error)
    } else {
      application.vaultLocks.lockNonPersistentVault(vault).catch(console.error)
    }
  }, [application.vaultDisplayService, application.vaultLocks, canShowLockOption, isLocked, vault])

  const isCurrentUserAdmin = !vault.isSharedVaultListing()
    ? true
    : application.vaultUsers.isCurrentUserSharedVaultAdmin(vault)
  const isCurrentUserOwner = !vault.isSharedVaultListing()
    ? true
    : application.vaultUsers.isCurrentUserSharedVaultOwner(vault)

  const ensureVaultIsUnlocked = useCallback(async () => {
    if (!application.vaultLocks.isVaultLocked(vault)) {
      return true
    }
    const unlocked = await application.vaultDisplayService.unlockVault(vault)
    return unlocked
  }, [application, vault])

  return {
    canShowLockOption,
    isLocked,
    toggleLock,
    ensureVaultIsUnlocked,
    isCurrentUserAdmin,
    isCurrentUserOwner,
  }
}

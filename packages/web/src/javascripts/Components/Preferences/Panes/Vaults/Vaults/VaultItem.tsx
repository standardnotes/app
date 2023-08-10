import { formatSizeToReadableString } from '@standardnotes/filepicker'
import { ButtonType, VaultListingInterface, isClientDisplayableError } from '@standardnotes/snjs'
import { useCallback, useState } from 'react'

import { useApplication } from '@/Components/ApplicationProvider'
import Button from '@/Components/Button/Button'
import Icon from '@/Components/Icon/Icon'
import ModalOverlay from '@/Components/Modal/ModalOverlay'
import ContactInviteModal from '../Invites/ContactInviteModal'
import EditVaultModal from './VaultModal/EditVaultModal'
type Props = {
  vault: VaultListingInterface
}

const VaultItem = ({ vault }: Props) => {
  const application = useApplication()

  const [isInviteModalOpen, setIsAddContactModalOpen] = useState(false)
  const closeInviteModal = () => setIsAddContactModalOpen(false)

  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false)
  const closeVaultModal = () => setIsVaultModalOpen(false)

  const isAdmin = !vault.isSharedVaultListing() ? true : application.vaultUsers.isCurrentUserSharedVaultAdmin(vault)

  const deleteVault = useCallback(async () => {
    const confirm = await application.alerts.confirm(
      'Deleting a vault will permanently delete all its items and files.',
      'Are you sure you want to delete this vault?',
      undefined,
      ButtonType.Danger,
    )

    if (!confirm) {
      return
    }

    const authorized = await application.vaults.authorizeVaultDeletion(vault)

    if (!authorized.getValue()) {
      return
    }

    if (vault.isSharedVaultListing()) {
      const result = await application.sharedVaults.deleteSharedVault(vault)
      if (isClientDisplayableError(result)) {
        void application.alerts.showErrorAlert(result)
      }
    } else {
      const success = await application.vaults.deleteVault(vault)
      if (!success) {
        void application.alerts.alert('Unable to delete vault. Please try again.')
      }
    }
  }, [application.alerts, application.sharedVaults, application.vaults, vault])

  const leaveVault = useCallback(async () => {
    if (!vault.isSharedVaultListing()) {
      return
    }

    const confirm = await application.alerts.confirm(
      'All items and files in this vault will be removed from your account.',
      'Are you sure you want to leave this vault?',
      undefined,
      ButtonType.Danger,
    )
    if (!confirm) {
      return
    }

    const success = await application.vaultUsers.leaveSharedVault(vault)
    if (!success) {
      void application.alerts.alert('Unable to leave vault. Please try again.')
    }
  }, [application, vault])

  const convertToSharedVault = useCallback(async () => {
    await application.sharedVaults.convertVaultToSharedVault(vault)
  }, [application.sharedVaults, vault])

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

  const openInviteModal = useCallback(async () => {
    if (!(await ensureVaultIsUnlocked())) {
      return
    }

    setIsAddContactModalOpen(true)
  }, [ensureVaultIsUnlocked])

  return (
    <>
      {vault.isSharedVaultListing() && (
        <ModalOverlay isOpen={isInviteModalOpen} close={closeInviteModal}>
          <ContactInviteModal vault={vault} onCloseDialog={closeInviteModal} />
        </ModalOverlay>
      )}

      <ModalOverlay isOpen={isVaultModalOpen} close={closeVaultModal}>
        <EditVaultModal existingVaultUuid={vault.uuid} onCloseDialog={closeVaultModal} />
      </ModalOverlay>

      <div className="flex flex-row gap-3.5 rounded-lg px-3.5 py-2.5 border border-border shadow">
        <Icon type={vault.iconString} size="custom" className="mt-2.5 h-5.5 w-5.5 flex-shrink-0" />
        <div className="flex flex-col gap-1.5 py-1.5">
          <span className="mr-auto overflow-hidden text-ellipsis text-base font-bold">{vault.name}</span>
          {vault.description && (
            <span className="mr-auto overflow-hidden text-ellipsis text-sm">{vault.description}</span>
          )}
          <span className="mr-auto overflow-hidden text-ellipsis text-sm">Vault ID: {vault.systemIdentifier}</span>

          <span className="mr-auto overflow-hidden text-ellipsis text-sm">
            File storage used: {formatSizeToReadableString(vault.sharing?.fileBytesUsed ?? 0)}
          </span>

          <div className="mt-2 flex w-full">
            <Button label="Edit" className="mr-3 text-xs" onClick={openEditModal} />
            {isAdmin && <Button colorStyle="danger" label="Delete" className="mr-3 text-xs" onClick={deleteVault} />}
            {!isAdmin && vault.isSharedVaultListing() && (
              <Button label="Leave Vault" className="mr-3 text-xs" onClick={leaveVault} />
            )}
            {vault.isSharedVaultListing() ? (
              <Button colorStyle="info" label="Invite Contacts" className="mr-3 text-xs" onClick={openInviteModal} />
            ) : (
              <Button
                colorStyle="info"
                label="Enable Collaboration"
                className="mr-3 text-xs"
                onClick={convertToSharedVault}
              />
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default VaultItem

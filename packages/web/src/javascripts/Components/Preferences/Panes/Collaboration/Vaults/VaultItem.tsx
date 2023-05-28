import { useApplication } from '@/Components/ApplicationProvider'
import Button from '@/Components/Button/Button'
import Icon from '@/Components/Icon/Icon'
import ModalOverlay from '@/Components/Modal/ModalOverlay'
import { VaultServerHash } from '@standardnotes/snjs'
import { useCallback, useState } from 'react'
import ContactInviteModal from '../Invites/ContactInviteModal'
import EditVaultModal from './EditVaultModal'

type Props = {
  vault: VaultServerHash
}

const VaultItem = ({ vault }: Props) => {
  const application = useApplication()
  const vaultKey = application.vaults.getVaultKey(vault.uuid)

  const [isInviteModalOpen, setIsAddContactModalOpen] = useState(false)
  const closeInviteModal = () => setIsAddContactModalOpen(false)

  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false)
  const closeVaultModal = () => setIsVaultModalOpen(false)

  const isAdmin = application.vaults.isUserVaultAdmin(vault.uuid)

  const deleteVault = useCallback(async () => {
    const success = await application.vaults.deleteVault(vault.uuid)
    if (!success) {
      void application.alertService.alert('Unable to delete vault. Please try again.')
    }
  }, [application.alertService, application.vaults, vault.uuid])

  const leaveVault = useCallback(async () => {
    const success = await application.vaults.leaveVault(vault.uuid)
    if (!success) {
      void application.alertService.alert('Unable to leave vault. Please try again.')
    }
  }, [application.alertService, application.vaults, vault.uuid])

  if (!vaultKey) {
    return <div>Unable to locate vault information.</div>
  }

  return (
    <>
      <ModalOverlay isOpen={isInviteModalOpen} close={closeInviteModal}>
        <ContactInviteModal vault={vault} onCloseDialog={closeInviteModal} />
      </ModalOverlay>

      <ModalOverlay isOpen={isVaultModalOpen} close={closeVaultModal}>
        <EditVaultModal existingVaultUuid={vault.uuid} onCloseDialog={closeVaultModal} />
      </ModalOverlay>

      <div className="bg-gray-100 flex flex-row gap-3.5 rounded-lg py-2.5 px-3.5 shadow-md">
        <Icon type={'safe-square'} size="custom" className="mt-2.5 h-5.5 w-5.5 flex-shrink-0" />
        <div className="flex flex-col gap-2 py-1.5">
          <span className="mr-auto overflow-hidden text-ellipsis text-base font-bold">{vaultKey.vaultName}</span>
          <span className="mr-auto overflow-hidden text-ellipsis text-sm">{vaultKey.vaultDescription}</span>
          <span className="mr-auto overflow-hidden text-ellipsis text-sm">Vault ID: {vault.uuid}</span>

          <div className="mt-2.5 flex flex-row">
            <Button label="Edit" className={'mr-3 text-xs'} onClick={() => setIsVaultModalOpen(true)} />
            <Button label="Invite Contacts" className={'mr-3 text-xs'} onClick={() => setIsAddContactModalOpen(true)} />
            {isAdmin && <Button label="Delete Vault" className={'mr-3 text-xs'} onClick={deleteVault} />}
            {!isAdmin && <Button label="Leave Vault" className={'mr-3 text-xs'} onClick={leaveVault} />}
          </div>
        </div>
      </div>
    </>
  )
}

export default VaultItem

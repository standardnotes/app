import { useCallback, useState } from 'react'
import { useApplication } from '@/Components/ApplicationProvider'
import { SharedVaultUserServerHash, VaultListingInterface } from '@standardnotes/snjs'
import Icon from '@/Components/Icon/Icon'
import Button from '@/Components/Button/Button'
import ModalOverlay from '@/Components/Modal/ModalOverlay'
import DesignateSurvivorModal from './DesignateSurvivorModal'

export const VaultModalMembers = ({
  members,
  isCurrentUserAdmin,
  vault,
  onChange,
}: {
  members: SharedVaultUserServerHash[]
  vault: VaultListingInterface
  isCurrentUserAdmin: boolean
  onChange: () => void
}) => {
  const application = useApplication()

  const removeMemberFromVault = useCallback(
    async (memberItem: SharedVaultUserServerHash) => {
      if (vault.isSharedVaultListing()) {
        await application.vaultUsers.removeUserFromSharedVault(vault, memberItem.user_uuid)
        onChange()
      }
    },
    [application.vaultUsers, vault, onChange],
  )

  const vaultHasNoDesignatedSurvivor = vault.isSharedVaultListing() && !vault.sharing.designatedSurvivor
  const [isDesignateSurvivorModalOpen, setIsDesignateSurvivorModalOpen] = useState(false)
  const openDesignateSurvivorModal = () => setIsDesignateSurvivorModalOpen(true)
  const closeDesignateSurvivorModal = () => setIsDesignateSurvivorModalOpen(false)

  return (
    <div>
      <div className="mb-3 text-lg">Vault Members</div>
      {vaultHasNoDesignatedSurvivor && members.length > 1 && isCurrentUserAdmin && (
        <div className="bg-danger-faded mb-3 grid grid-cols-[auto,1fr] gap-x-[0.65rem] gap-y-0.5 overflow-hidden rounded p-2.5 text-danger">
          <Icon type="warning" className="place-self-center" />
          <div className="text-base font-semibold">No designated survivor</div>
          <div className="col-start-2">
            Vaults that have no designated survivor will be deleted when the owner account is deleted. In order to
            ensure that no data is lost, please designate a survivor who will be transferred ownership of the vault.
          </div>
          <Button small className="col-start-2 mt-1.5" onClick={openDesignateSurvivorModal}>
            Designate survivor
          </Button>
          <ModalOverlay isOpen={isDesignateSurvivorModalOpen} close={closeDesignateSurvivorModal}>
            <DesignateSurvivorModal vault={vault} members={members} closeModal={closeDesignateSurvivorModal} />
          </ModalOverlay>
        </div>
      )}
      <div className="space-y-3.5">
        {members.map((member) => {
          const isMemberVaultOwner = application.vaultUsers.isVaultUserOwner(member)
          const contact = application.contacts.findContactForServerUser(member)
          const permission = application.vaultUsers.getFormattedMemberPermission(member.permission)

          return (
            <div
              key={contact?.uuid || member.user_uuid}
              className="grid grid-cols-[auto,1fr] gap-x-[0.65rem] gap-y-0.5 text-base font-medium md:text-sm"
            >
              <Icon type="user" className="col-start-1 col-end-2 place-self-center" />
              <div className="flex items-center gap-2 overflow-hidden text-ellipsis text-base font-bold">
                <span>{contact?.name || member.user_uuid}</span>
                {contact ? (
                  <div className="flex items-center gap-1 rounded bg-success px-1 py-0.5 text-xs text-success-contrast">
                    <Icon type="check-circle" size="small" />
                    Trusted
                  </div>
                ) : (
                  <div className="flex items-center gap-1 rounded bg-danger px-1 py-0.5 pr-1.5 text-xs text-danger-contrast">
                    <Icon type="clear-circle-filled" size="small" />
                    Untrusted
                  </div>
                )}
                {member.is_designated_survivor && (
                  <div className="flex items-center gap-1 rounded bg-info px-1 py-0.5 text-xs text-success-contrast">
                    <Icon type="security" size="small" />
                    Designated survivor
                  </div>
                )}
              </div>
              <div className="col-start-2 row-start-2">{permission}</div>
              {isCurrentUserAdmin && !isMemberVaultOwner && (
                <Button
                  className="col-start-2 row-start-3 mt-1"
                  label="Remove From Vault"
                  onClick={() => removeMemberFromVault(member)}
                  small
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

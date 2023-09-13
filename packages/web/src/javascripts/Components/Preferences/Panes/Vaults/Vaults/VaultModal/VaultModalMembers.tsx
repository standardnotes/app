import { useCallback } from 'react'
import { useApplication } from '@/Components/ApplicationProvider'
import { SharedVaultUserServerHash, VaultListingInterface } from '@standardnotes/snjs'
import Icon from '@/Components/Icon/Icon'
import Button from '@/Components/Button/Button'

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

  return (
    <div>
      <div className="mb-3 text-lg">Vault Members</div>
      <div className="space-y-3.5">
        {members.map((member) => {
          const isMemberVaultOwner = application.vaultUsers.isVaultUserOwner(member)
          const contact = application.contacts.findContactForServerUser(member)
          return (
            <div
              key={contact?.uuid || member.user_uuid}
              className="grid grid-cols-[auto,1fr] gap-x-[0.65rem] gap-y-2 text-base font-medium md:text-sm"
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
              </div>
              {isCurrentUserAdmin && !isMemberVaultOwner && (
                <Button
                  className="col-start-2 row-start-2"
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

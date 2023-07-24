import { useCallback } from 'react'
import { useApplication } from '@/Components/ApplicationProvider'
import { SharedVaultUserServerHash, VaultListingInterface } from '@standardnotes/snjs'
import Icon from '@/Components/Icon/Icon'
import Button from '@/Components/Button/Button'

export const VaultModalMembers = ({
  members,
  isAdmin,
  vault,
  onChange,
}: {
  members: SharedVaultUserServerHash[]
  vault: VaultListingInterface
  isAdmin: boolean
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
    <div className="mb-3">
      <div className="mb-3 text-lg">Vault Members</div>
      {members.map((member) => {
        if (application.vaultUsers.isVaultUserOwner(member)) {
          return null
        }

        const contact = application.contacts.findTrustedContactForServerUser(member)
        return (
          <div
            key={contact?.uuid || member.user_uuid}
            className="bg-gray-100 flex flex-row gap-3.5 rounded-lg px-3.5 py-2.5 shadow-md"
          >
            <Icon type={'user'} size="custom" className="mt-2.5 h-5.5 w-5.5 flex-shrink-0" />
            <div className="flex flex-col gap-2 py-1.5">
              <span className="mr-auto overflow-hidden text-ellipsis text-base font-bold">
                {contact?.name || member.user_uuid}
              </span>
              {contact && <span className="text-info">Trusted</span>}
              {!contact && (
                <div>
                  <span className="text-base">Untrusted</span>
                </div>
              )}

              {isAdmin && (
                <div className="mt-2.5 flex flex-row">
                  <Button
                    label="Remove From Vault"
                    className={'mr-3 text-xs'}
                    onClick={() => removeMemberFromVault(member)}
                  />
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

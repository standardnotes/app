import { useCallback } from 'react'
import { useApplication } from '@/Components/ApplicationProvider'
import { SharedVaultInviteServerHash } from '@standardnotes/snjs'
import Icon from '@/Components/Icon/Icon'
import Button from '@/Components/Button/Button'

export const VaultModalInvites = ({
  invites,
  onChange,
  isAdmin,
}: {
  invites: SharedVaultInviteServerHash[]
  onChange: () => void
  isAdmin: boolean
}) => {
  const application = useApplication()

  const deleteInvite = useCallback(
    async (invite: SharedVaultInviteServerHash) => {
      await application.sharedVaults.deleteInvite(invite)
      onChange()
    },
    [application.sharedVaults, onChange],
  )

  return (
    <div className="mb-3">
      <div className="mb-3 text-lg">Pending Invites</div>
      {invites.map((invite) => {
        const contact = application.contacts.findTrustedContactForInvite(invite)
        return (
          <div key={invite.uuid} className="bg-gray-100 flex flex-row gap-3.5 rounded-lg py-2.5 px-3.5 shadow-md">
            <Icon type={'user'} size="custom" className="mt-2.5 h-5.5 w-5.5 flex-shrink-0" />
            <div className="flex flex-col gap-2 py-1.5">
              <span className="mr-auto overflow-hidden text-ellipsis text-base font-bold">
                {contact?.name || invite.user_uuid}
              </span>
              {contact && <span className="text-info">Trusted</span>}
              {!contact && (
                <div>
                  <span className="text-base">Untrusted</span>
                </div>
              )}

              {isAdmin && (
                <div className="mt-2.5 flex flex-row">
                  <Button label="Cancel Invite" className={'mr-3 text-xs'} onClick={() => deleteInvite(invite)} />
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

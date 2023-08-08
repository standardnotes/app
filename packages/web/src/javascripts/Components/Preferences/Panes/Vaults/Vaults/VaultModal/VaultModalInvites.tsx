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
      await application.vaultInvites.deleteInvite(invite)
      onChange()
    },
    [application.vaultInvites, onChange],
  )

  return (
    <div className="mb-3">
      <div className="mb-3 text-lg">Pending Invites</div>
      <div className="flex flex-col gap-3">
        {invites.map((invite) => {
          const contact = application.contacts.findContactForInvite(invite)
          return (
            <div key={invite.uuid} className="flex gap-3.5 rounded-lg px-3.5 py-2.5 border border-border shadow">
              <Icon type="user" size="custom" className="mt-2 h-5.5 w-5.5 flex-shrink-0" />
              <div className="flex flex-col gap-2 py-1.5">
                <div className="flex items-center gap-2 overflow-hidden text-ellipsis text-base font-bold">
                  <span>{contact?.name || invite.user_uuid}</span>
                  {contact ? (
                    <div className="flex items-center bg-success text-success-contrast rounded gap-1 text-xs px-1 py-0.5">
                      <Icon type="check-circle" size="small" />
                      Trusted
                    </div>
                  ) : (
                    <div className="flex items-center bg-danger text-danger-contrast rounded gap-1 text-xs px-1 pr-1.5 py-0.5">
                      <Icon type="clear-circle-filled" size="small" />
                      Untrusted
                    </div>
                  )}
                </div>
                {isAdmin && (
                  <Button label="Cancel Invite" className="mt-1 mr-3 text-xs" onClick={() => deleteInvite(invite)} />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

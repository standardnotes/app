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
    <div>
      <div className="mb-3 text-lg">Pending Invites</div>
      <div className="space-y-3.5">
        {invites.map((invite) => {
          const contact = application.contacts.findContactForInvite(invite)
          return (
            <div
              key={invite.uuid}
              className="grid grid-cols-[auto,1fr] text-base font-medium [column-gap:0.65rem] [row-gap:0.5rem] md:text-sm"
            >
              <Icon type="user" className="col-start-1 col-end-2 place-self-center" />
              <div className="flex items-center gap-2 overflow-hidden text-ellipsis text-base font-bold">
                <span>{contact?.name || invite.user_uuid}</span>
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
              {isAdmin && (
                <Button
                  label="Cancel Invite"
                  className="col-start-2 row-start-2"
                  onClick={() => deleteInvite(invite)}
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

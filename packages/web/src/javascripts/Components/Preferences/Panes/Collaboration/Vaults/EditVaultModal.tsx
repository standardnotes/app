import { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react'
import Modal, { ModalAction } from '@/Components/Modal/Modal'
import DecoratedInput from '@/Components/Input/DecoratedInput'
import { useApplication } from '@/Components/ApplicationProvider'
import { SharedVaultInviteServerHash, SharedVaultUserServerHash, isClientDisplayableError } from '@standardnotes/snjs'
import Icon from '@/Components/Icon/Icon'
import Button from '@/Components/Button/Button'

type Props = {
  existingVaultUuid?: string
  onCloseDialog: () => void
}

const EditVaultModal: FunctionComponent<Props> = ({ onCloseDialog, existingVaultUuid }) => {
  const application = useApplication()

  const [name, setName] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [members, setMembers] = useState<SharedVaultUserServerHash[]>([])
  const [invites, setInvites] = useState<SharedVaultInviteServerHash[]>([])
  const [isAdmin, setIsAdmin] = useState<boolean>(false)

  const reloadVaultInfo = useCallback(async () => {
    if (existingVaultUuid) {
      const vaultInfo = application.vaults.getVaultInfo(existingVaultUuid)
      setName(vaultInfo?.vaultName ?? '')
      setDescription(vaultInfo?.vaultDescription ?? '')
      setIsAdmin(application.vaults.isUserGroupAdmin(existingVaultUuid))

      const users = await application.vaults.getSharedVaultUsers(existingVaultUuid)
      if (users) {
        setMembers(users)
      }

      const invites = await application.vaults.getOutboundInvites(existingVaultUuid)
      if (!isClientDisplayableError(invites)) {
        setInvites(invites)
      }
    }
  }, [application.vaults, existingVaultUuid])

  useEffect(() => {
    if (existingVaultUuid) {
      void reloadVaultInfo()
    }
  }, [application.vaults, existingVaultUuid, reloadVaultInfo])

  const handleDialogClose = useCallback(() => {
    onCloseDialog()
  }, [onCloseDialog])

  const handleSubmit = useCallback(async () => {
    if (existingVaultUuid) {
      await application.vaults.changeVaultNameAndDescription(existingVaultUuid, {
        name: name,
        description: description,
      })
      handleDialogClose()
    } else {
      const vault = await application.vaults.createRandomizedVault(name, description)
      if (vault) {
        handleDialogClose()
      } else {
        void application.alertService.alert('Unable to create vault. Please try again.')
      }
    }
  }, [existingVaultUuid, application.vaults, application.alertService, name, description, handleDialogClose])

  const removeMemberFromVault = useCallback(
    async (member: SharedVaultUserServerHash) => {
      if (existingVaultUuid) {
        await application.vaults.removeUserFromGroup(existingVaultUuid, member.uuid)
        await reloadVaultInfo()
      }
    },
    [application.vaults, existingVaultUuid, reloadVaultInfo],
  )

  const deleteInvite = useCallback(
    async (invite: SharedVaultInviteServerHash) => {
      await application.vaults.deleteInvite(invite)
      await reloadVaultInfo()
    },
    [application.vaults, reloadVaultInfo],
  )

  const modalActions = useMemo(
    (): ModalAction[] => [
      {
        label: existingVaultUuid ? 'Save Vault' : 'Create Vault',
        onClick: handleSubmit,
        type: 'primary',
        mobileSlot: 'right',
      },
      {
        label: 'Cancel',
        onClick: handleDialogClose,
        type: 'cancel',
        mobileSlot: 'left',
      },
    ],
    [existingVaultUuid, handleDialogClose, handleSubmit],
  )

  return (
    <Modal
      title={existingVaultUuid ? 'Edit Vault' : 'Create New Vault'}
      close={handleDialogClose}
      actions={modalActions}
    >
      <div className="px-4.5 pt-4 pb-1.5">
        <div className="flex w-full flex-col">
          <div className="mb-3">
            <div className="text-lg">Vault Info</div>
            <div className="mt-1">
              A vault's name and description are end-to-end encrypted and can only be seen by its members.
            </div>

            <DecoratedInput
              className={{ container: 'mt-4' }}
              id="vault-name-input"
              value={name}
              placeholder="Vault Name"
              onChange={(value) => {
                setName(value)
              }}
            />

            <DecoratedInput
              className={{ container: 'mt-4' }}
              id="vault-email-input"
              value={description}
              placeholder="Vault description"
              onChange={(value) => {
                setDescription(value)
              }}
            />
          </div>

          {existingVaultUuid && (
            <div className="mb-3">
              <div className="mb-3 text-lg">Vault Members</div>
              {members.map((member) => {
                if (application.vaults.isSharedVaultUserGroupOwner(member)) {
                  return null
                }

                const contact = application.contacts.findTrustedContactForServerUser(member)
                return (
                  <div className="bg-gray-100 flex flex-row gap-3.5 rounded-lg py-2.5 px-3.5 shadow-md">
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
          )}

          {existingVaultUuid && (
            <div className="mb-3">
              <div className="mb-3 text-lg">Pending Invites</div>
              {invites.map((invite) => {
                const contact = application.contacts.findTrustedContactForInvite(invite)

                return (
                  <div className="bg-gray-100 flex flex-row gap-3.5 rounded-lg py-2.5 px-3.5 shadow-md">
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
                          <Button
                            label="Cancel Invite"
                            className={'mr-3 text-xs'}
                            onClick={() => deleteInvite(invite)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default EditVaultModal

import { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react'
import Modal, { ModalAction } from '@/Components/Modal/Modal'
import DecoratedInput from '@/Components/Input/DecoratedInput'
import { useApplication } from '@/Components/ApplicationProvider'
import { GroupInviteServerHash, GroupUserServerHash, isClientDisplayableError } from '@standardnotes/snjs'
import Icon from '@/Components/Icon/Icon'
import Button from '@/Components/Button/Button'

type Props = {
  existingGroupUuid?: string
  onCloseDialog: () => void
}

const EditGroupModal: FunctionComponent<Props> = ({ onCloseDialog, existingGroupUuid }) => {
  const application = useApplication()

  const [name, setName] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [members, setMembers] = useState<GroupUserServerHash[]>([])
  const [invites, setInvites] = useState<GroupInviteServerHash[]>([])
  const [isAdmin, setIsAdmin] = useState<boolean>(false)

  const reloadGroupInfo = useCallback(async () => {
    if (existingGroupUuid) {
      const groupInfo = application.groups.getGroupInfo(existingGroupUuid)
      setName(groupInfo?.groupName ?? '')
      setDescription(groupInfo?.groupDescription ?? '')
      setIsAdmin(application.groups.isUserGroupAdmin(existingGroupUuid))

      const users = await application.groups.getGroupUsers(existingGroupUuid)
      if (users) {
        setMembers(users)
      }

      const invites = await application.groups.getOutboundInvites(existingGroupUuid)
      if (!isClientDisplayableError(invites)) {
        setInvites(invites)
      }
    }
  }, [application.groups, existingGroupUuid])

  useEffect(() => {
    if (existingGroupUuid) {
      void reloadGroupInfo()
    }
  }, [application.groups, existingGroupUuid, reloadGroupInfo])

  const handleDialogClose = useCallback(() => {
    onCloseDialog()
  }, [onCloseDialog])

  const handleSubmit = useCallback(async () => {
    if (existingGroupUuid) {
      await application.groups.changeGroupMetadata(existingGroupUuid, {
        name: name,
        description: description,
      })
      handleDialogClose()
    } else {
      const group = await application.groups.createGroup(name, description)
      if (group) {
        handleDialogClose()
      } else {
        void application.alertService.alert('Unable to create group. Please try again.')
      }
    }
  }, [existingGroupUuid, application.groups, application.alertService, name, description, handleDialogClose])

  const removeMemberFromGroup = useCallback(
    async (member: GroupUserServerHash) => {
      if (existingGroupUuid) {
        await application.groups.removeUserFromGroup(existingGroupUuid, member.uuid)
        await reloadGroupInfo()
      }
    },
    [application.groups, existingGroupUuid, reloadGroupInfo],
  )

  const deleteInvite = useCallback(
    async (invite: GroupInviteServerHash) => {
      await application.groups.deleteInvite(invite)
      await reloadGroupInfo()
    },
    [application.groups, reloadGroupInfo],
  )

  const modalActions = useMemo(
    (): ModalAction[] => [
      {
        label: existingGroupUuid ? 'Save Group' : 'Create Group',
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
    [existingGroupUuid, handleDialogClose, handleSubmit],
  )

  return (
    <Modal
      title={existingGroupUuid ? 'Edit Group' : 'Create New Group'}
      close={handleDialogClose}
      actions={modalActions}
    >
      <div className="px-4.5 pt-4 pb-1.5">
        <div className="flex w-full flex-col">
          <div className="mb-3">
            <div className="text-lg">Group Info</div>
            <div className="mt-1">
              A group's name and description are end-to-end encrypted and can only be seen by group members.
            </div>

            <DecoratedInput
              className={{ container: 'mt-4' }}
              id="group-name-input"
              value={name}
              placeholder="Group Name"
              onChange={(value) => {
                setName(value)
              }}
            />

            <DecoratedInput
              className={{ container: 'mt-4' }}
              id="group-email-input"
              value={description}
              placeholder="Group description"
              onChange={(value) => {
                setDescription(value)
              }}
            />
          </div>

          {existingGroupUuid && (
            <div className="mb-3">
              <div className="mb-3 text-lg">Group Members</div>
              {members.map((member) => {
                if (application.groups.isGroupUserOwnUser(member)) {
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
                            label="Remove From Group"
                            className={'mr-3 text-xs'}
                            onClick={() => removeMemberFromGroup(member)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {existingGroupUuid && (
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

export default EditGroupModal

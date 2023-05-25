import { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react'
import Modal, { ModalAction } from '@/Components/Modal/Modal'
import DecoratedInput from '@/Components/Input/DecoratedInput'
import { useApplication } from '@/Components/ApplicationProvider'

type Props = {
  existingGroupUuid?: string
  onCloseDialog: () => void
}

const EditGroupModal: FunctionComponent<Props> = ({ onCloseDialog, existingGroupUuid }) => {
  const application = useApplication()

  const [name, setName] = useState<string>('')
  const [description, setDescription] = useState<string>('')

  useEffect(() => {
    if (existingGroupUuid) {
      const groupInfo = application.groups.getGroupInfo(existingGroupUuid)

      setName(groupInfo?.groupName ?? '')
      setDescription(groupInfo?.groupDescription ?? '')
    }
  }, [application.groups, existingGroupUuid])

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
            <label className="mb-1 block font-bold" htmlFor="invite-email-input">
              Group info
            </label>

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

            <div className="mt-4">
              A group's name and description are end-to-end encrypted and can only be seen by group members.
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default EditGroupModal

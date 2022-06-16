import { Menu, MenuButton, MenuItem, MenuList } from '@reach/menu-button'
import VisuallyHidden from '@reach/visually-hidden'
import { useState } from 'react'

import { useAppDispatch } from '../../app/hooks'
import { tasksGroupDeleted } from './tasks-slice'

import { MergeIcon, MoreIcon, RenameIcon, TrashIcon } from '../../common/components/icons'

import { ConfirmDialog } from '../../common/components'

import MergeTaskGroups from './MergeTaskGroups'
import RenameTaskGroups from './RenameTaskGroups'

type TaskGroupOptionsProps = {
  groupName: string
}

const TaskGroupOptions: React.FC<TaskGroupOptionsProps> = ({ groupName }) => {
  const dispatch = useAppDispatch()

  const [showMergeDialog, setShowMergeDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showRenameDialog, setShowRenameDialog] = useState(false)

  return (
    <>
      <Menu>
        <MenuButton data-testid="task-group-options" className="sn-icon-button">
          <VisuallyHidden>Options for '{groupName}' group</VisuallyHidden>
          <MoreIcon />
        </MenuButton>
        <MenuList>
          <MenuItem data-testid="delete-task-group" onSelect={() => setShowDeleteDialog(true)}>
            <TrashIcon />
            <span className="px-1">Delete group</span>
          </MenuItem>
          <MenuItem data-testid="merge-task-group" onSelect={() => setShowMergeDialog(true)}>
            <MergeIcon />
            <span className="px-1">Merge into another group</span>
          </MenuItem>
          <MenuItem data-testid="rename-task-group" onSelect={() => setShowRenameDialog(true)}>
            <RenameIcon />
            <span className="px-1">Rename</span>
          </MenuItem>
        </MenuList>
      </Menu>
      {showDeleteDialog && (
        <ConfirmDialog
          testId="delete-task-group-dialog"
          title="Delete group"
          confirmButtonText="Delete"
          confirmButtonStyle="danger"
          confirmButtonCb={() => dispatch(tasksGroupDeleted({ groupName }))}
          cancelButtonCb={() => setShowDeleteDialog(false)}
        >
          Are you sure you want to delete the group '<strong>{groupName}</strong>'?
        </ConfirmDialog>
      )}
      {showMergeDialog && <MergeTaskGroups groupName={groupName} handleClose={() => setShowMergeDialog(false)} />}
      {showRenameDialog && <RenameTaskGroups groupName={groupName} handleClose={() => setShowRenameDialog(false)} />}
    </>
  )
}

export default TaskGroupOptions

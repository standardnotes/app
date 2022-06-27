import { useState } from 'react'
import styled from 'styled-components'

import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { ConfirmDialog } from '../../common/components'

import { deleteAllCompleted, openAllCompleted } from './tasks-slice'

const ActionButton = styled.button`
  background-color: var(--sn-stylekit-contrast-background-color);
  border-radius: 4px;
  border-style: none;
  color: var(--sn-stylekit-paragraph-text-color);
  cursor: pointer;
  display: inline;
  font-size: var(--sn-stylekit-font-size-h6);
  font-weight: 500;
  height: 25px;
  margin-right: 10px;
  opacity: 0.96;
  padding: 4px 10px 4px;

  &:hover {
    opacity: 0.8;
    text-decoration: none;
  }
`

type CompletedTasksActionsProps = {
  groupName: string
}

const CompletedTasksActions: React.FC<CompletedTasksActionsProps> = ({ groupName }) => {
  const dispatch = useAppDispatch()

  const canEdit = useAppSelector((state) => state.settings.canEdit)

  const [showReopenDialog, setShowReopenDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  if (!canEdit) {
    return <></>
  }

  return (
    <div data-testid="completed-tasks-actions">
      <ActionButton onClick={() => setShowReopenDialog(true)} data-testid="reopen-completed-button">
        Reopen Completed
      </ActionButton>
      <ActionButton onClick={() => setShowDeleteDialog(true)} data-testid="delete-completed-button">
        Delete Completed
      </ActionButton>
      {showReopenDialog && (
        <ConfirmDialog
          testId="reopen-all-tasks-dialog"
          confirmButtonStyle="danger"
          confirmButtonCb={() => dispatch(openAllCompleted({ groupName }))}
          cancelButtonCb={() => setShowReopenDialog(false)}
        >
          Are you sure you want to reopen completed tasks in the '<strong>{groupName}</strong>' group?
        </ConfirmDialog>
      )}
      {showDeleteDialog && (
        <ConfirmDialog
          testId="delete-completed-tasks-dialog"
          confirmButtonStyle="danger"
          confirmButtonCb={() => dispatch(deleteAllCompleted({ groupName }))}
          cancelButtonCb={() => setShowDeleteDialog(false)}
        >
          Are you sure you want to delete completed tasks in the '<strong>{groupName}</strong>' group?
        </ConfirmDialog>
      )}
    </div>
  )
}

export default CompletedTasksActions

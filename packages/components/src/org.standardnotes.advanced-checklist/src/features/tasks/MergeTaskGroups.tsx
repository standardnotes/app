import '@reach/dialog/styles.css'

import React, { useRef, useState } from 'react'
import { AlertDialog, AlertDialogLabel, AlertDialogDescription } from '@reach/alert-dialog'

import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { tasksGroupMerged } from './tasks-slice'

type MergeTaskGroupsProps = {
  groupName: string
  handleClose: () => void
}

const MergeTaskGroups: React.FC<MergeTaskGroupsProps> = ({ groupName, handleClose }) => {
  const cancelRef = useRef<HTMLButtonElement>(null)

  const dispatch = useAppDispatch()

  const groupedTasks = useAppSelector((state) => state.tasks.groups)
  const mergeableGroups = groupedTasks.filter((item) => item.name !== groupName)

  const [mergeWith, setMergeWith] = useState<string>()

  function handleChange(event: React.FormEvent<HTMLFieldSetElement>) {
    // @ts-ignore
    const selectedGroup = event.target.value
    setMergeWith(selectedGroup)
  }

  function handleMergeGroups() {
    if (!mergeWith) {
      handleClose()
      return
    }

    dispatch(tasksGroupMerged({ groupName, mergeWith }))
    handleClose()
  }

  return (
    <AlertDialog data-testid="merge-task-group-dialog" leastDestructiveRef={cancelRef}>
      <div className="sk-modal-content">
        <div className="sn-component">
          <div className="sk-panel">
            <div className="sk-panel-content">
              <div className="sk-panel-section">
                <AlertDialogLabel className="sk-h3 sk-panel-section-title">Merging task groups</AlertDialogLabel>

                {mergeableGroups.length > 0 ? (
                  <>
                    <AlertDialogDescription className="sk-panel-row">
                      <p className="color-foreground">
                        Select which group you want to merge '<strong>{groupName}</strong>' into:
                      </p>
                    </AlertDialogDescription>
                    <fieldset className="flex flex-col" onChange={handleChange}>
                      {mergeableGroups.map((item) => (
                        <label key={item.name} className="flex items-center mb-1">
                          <input type="radio" value={item.name} checked={item.name === mergeWith} readOnly />
                          {item.name}
                        </label>
                      ))}
                    </fieldset>
                  </>
                ) : (
                  <AlertDialogDescription>
                    <p className="color-foreground">
                      There are no other groups to merge '<strong>{groupName}</strong>' with.
                    </p>
                  </AlertDialogDescription>
                )}

                <div className="flex my-1 mt-4">
                  <button className="sn-button small neutral" onClick={handleClose} ref={cancelRef}>
                    {!mergeWith ? 'Close' : 'Cancel'}
                  </button>
                  <button className="sn-button small ml-2 info" onClick={handleMergeGroups}>
                    Merge groups
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AlertDialog>
  )
}

export default MergeTaskGroups

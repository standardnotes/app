import '@reach/dialog/styles.css'

import React, { useRef } from 'react'
import { AlertDialog, AlertDialogLabel } from '@reach/alert-dialog'

import { useAppDispatch } from '../../app/hooks'
import { tasksLegacyContentMigrated } from './tasks-slice'

const MigrateLegacyContent: React.FC = () => {
  const cancelRef = useRef<HTMLButtonElement>(null)

  const dispatch = useAppDispatch()

  function handleMigrate() {
    dispatch(tasksLegacyContentMigrated({ continue: true }))
  }

  function handleCancel() {
    dispatch(tasksLegacyContentMigrated({ continue: false }))
  }

  return (
    <AlertDialog
      data-testid="migrate-legacy-content-dialog"
      leastDestructiveRef={cancelRef}
    >
      <div className="sk-modal-content">
        <div className="sn-component">
          <div className="sk-panel">
            <div className="sk-panel-content">
              <div className="sk-panel-section">
                <AlertDialogLabel className="sk-h3 sk-panel-section-title">
                  Are you sure you want to migrate legacy content to the new
                  format?
                </AlertDialogLabel>

                <div className="flex my-1 mt-4">
                  <button
                    className="sn-button small neutral"
                    onClick={handleCancel}
                    ref={cancelRef}
                  >
                    Cancel
                  </button>
                  <button
                    className="sn-button small ml-2 info"
                    onClick={handleMigrate}
                  >
                    Migrate
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

export default MigrateLegacyContent

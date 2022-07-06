import '@reach/dialog/styles.css'

import { AlertDialog, AlertDialogDescription, AlertDialogLabel } from '@reach/alert-dialog'
import React, { useRef } from 'react'

import { sanitizeHtmlString } from '@standardnotes/utils'

type ConfirmDialogProps = {
  testId?: string
  title?: string
  confirmButtonText?: string
  confirmButtonStyle?: 'danger' | 'info'
  confirmButtonCb: () => void
  cancelButtonText?: string
  cancelButtonCb: () => void
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  testId,
  title = '',
  confirmButtonText = 'Confirm',
  confirmButtonStyle = 'info',
  confirmButtonCb,
  cancelButtonText = 'Cancel',
  cancelButtonCb,
  children,
}) => {
  const cancelRef = useRef<HTMLButtonElement>(null)

  return (
    <AlertDialog data-testid={testId} onDismiss={cancelButtonCb} leastDestructiveRef={cancelRef}>
      <div className="sk-modal-content">
        <div className="sn-component">
          <div className="sk-panel">
            <div className="sk-panel-content">
              <div className="sk-panel-section">
                <AlertDialogLabel
                  className="sk-h3 sk-panel-section-title"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtmlString(title),
                  }}
                />

                <AlertDialogDescription className="sk-panel-row">
                  <p className="color-foreground">{children}</p>
                </AlertDialogDescription>

                <div className="flex my-1">
                  <button
                    data-testid="cancel-dialog-button"
                    className="sn-button small neutral"
                    onClick={cancelButtonCb}
                    ref={cancelRef}
                  >
                    {cancelButtonText}
                  </button>
                  <button
                    data-testid="confirm-dialog-button"
                    className={`sn-button small ml-2 ${confirmButtonStyle}`}
                    onClick={confirmButtonCb}
                  >
                    {confirmButtonText}
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

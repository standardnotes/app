import { useEffect, useRef, useState } from 'preact/hooks'
import { AlertDialog, AlertDialogDescription, AlertDialogLabel } from '@reach/alert-dialog'
import { STRING_SIGN_OUT_CONFIRMATION } from '@/Strings'
import { WebApplication } from '@/UIModels/Application'
import { AppState } from '@/UIModels/AppState'
import { observer } from 'mobx-react-lite'

type Props = {
  application: WebApplication
  appState: AppState
}

export const ConfirmSignoutContainer = observer((props: Props) => {
  if (!props.appState.accountMenu.signingOut) {
    return null
  }
  return <ConfirmSignoutModal {...props} />
})

export const ConfirmSignoutModal = observer(({ application, appState }: Props) => {
  const [deleteLocalBackups, setDeleteLocalBackups] = useState(false)

  const cancelRef = useRef<HTMLButtonElement>(null)
  function closeDialog() {
    appState.accountMenu.setSigningOut(false)
  }

  const [localBackupsCount, setLocalBackupsCount] = useState(0)

  useEffect(() => {
    application.bridge.localBackupsCount().then(setLocalBackupsCount).catch(console.error)
  }, [appState.accountMenu.signingOut, application.bridge])

  return (
    <AlertDialog onDismiss={closeDialog} leastDestructiveRef={cancelRef}>
      <div className="sk-modal-content">
        <div className="sn-component">
          <div className="sk-panel">
            <div className="sk-panel-content">
              <div className="sk-panel-section">
                <AlertDialogLabel className="sk-h3 sk-panel-section-title">
                  Sign out workspace?
                </AlertDialogLabel>
                <AlertDialogDescription className="sk-panel-row">
                  <p className="color-foreground">{STRING_SIGN_OUT_CONFIRMATION}</p>
                </AlertDialogDescription>
                {localBackupsCount > 0 && (
                  <div className="flex">
                    <div className="sk-panel-row"></div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={deleteLocalBackups}
                        onChange={(event) => {
                          setDeleteLocalBackups((event.target as HTMLInputElement).checked)
                        }}
                      />
                      <span className="ml-2">
                        Delete {localBackupsCount} local backup file
                        {localBackupsCount > 1 ? 's' : ''}
                      </span>
                    </label>
                    <button
                      className="capitalize sk-a ml-1.5 p-0 rounded cursor-pointer"
                      onClick={() => {
                        application.bridge.viewlocalBackups()
                      }}
                    >
                      View backup files
                    </button>
                  </div>
                )}
                <div className="flex my-1 mt-4">
                  <button className="sn-button small neutral" ref={cancelRef} onClick={closeDialog}>
                    Cancel
                  </button>
                  <button
                    className="sn-button small danger ml-2"
                    onClick={() => {
                      if (deleteLocalBackups) {
                        application.signOutAndDeleteLocalBackups().catch(console.error)
                      } else {
                        application.user.signOut().catch(console.error)
                      }
                      closeDialog()
                    }}
                  >
                    {application.hasAccount() ? 'Sign Out' : 'Clear Session Data'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AlertDialog>
  )
})

import { observer } from 'mobx-react-lite'
import { ViewControllerManager } from '@Controllers/ViewControllerManager'
import { AlertDialog, AlertDialogDescription, AlertDialogLabel } from '@reach/alert-dialog'
import { useRef } from 'react'
import { STRING_DELETE_ACCOUNT_CONFIRMATION } from '@/Constants/Strings'
import Button from '@/Components/Button/Button'
import { WebApplication } from '@/Application/Application'

type Props = {
  viewControllerManager: ViewControllerManager
  application: WebApplication
}

const ConfirmDeleteAccountModal = ({ application, viewControllerManager }: Props) => {
  function closeDialog() {
    viewControllerManager.accountMenuController.setDeletingAccount(false)
  }

  const cancelRef = useRef<HTMLButtonElement>(null)

  return (
    <AlertDialog onDismiss={closeDialog} leastDestructiveRef={cancelRef} className="max-w-[600px] p-0">
      <div className="sk-modal-content">
        <div className="sn-component">
          <div className="sk-panel">
            <div className="sk-panel-content">
              <div className="sk-panel-section">
                <AlertDialogLabel className="sk-h3 sk-panel-section-title">Delete account?</AlertDialogLabel>
                <AlertDialogDescription className="sk-panel-row">
                  <div>
                    <p className="text-foreground">{STRING_DELETE_ACCOUNT_CONFIRMATION}</p>
                  </div>
                </AlertDialogDescription>

                <div className="my-1 mt-4 flex gap-2">
                  <Button primary small colorStyle="neutral" rounded={false} ref={cancelRef} onClick={closeDialog}>
                    Cancel
                  </Button>
                  <Button
                    primary
                    small
                    colorStyle="danger"
                    rounded={false}
                    onClick={() => {
                      application.user.deleteAccount().catch(console.error)
                      closeDialog()
                    }}
                  >
                    Delete my account for good
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AlertDialog>
  )
}

ConfirmDeleteAccountModal.displayName = 'ConfirmDeleteAccountModal'

const ConfirmDeleteAccountContainer = (props: Props) => {
  if (!props.viewControllerManager.accountMenuController.deletingAccount) {
    return null
  }
  return <ConfirmDeleteAccountModal {...props} />
}

export default observer(ConfirmDeleteAccountContainer)

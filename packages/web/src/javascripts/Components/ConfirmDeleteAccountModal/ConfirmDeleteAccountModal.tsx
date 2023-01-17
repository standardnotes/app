import { observer } from 'mobx-react-lite'
import { ViewControllerManager } from '@Controllers/ViewControllerManager'
import { AlertDialog, AlertDialogDescription, AlertDialogLabel } from '@reach/alert-dialog'
import { useCallback, useRef } from 'react'
import { STRING_DELETE_ACCOUNT_CONFIRMATION } from '@/Constants/Strings'
import Button from '@/Components/Button/Button'
import { WebApplication } from '@/Application/Application'
import Icon from '../Icon/Icon'

type Props = {
  viewControllerManager: ViewControllerManager
  application: WebApplication
}

const ConfirmDeleteAccountModal = ({ application, viewControllerManager }: Props) => {
  const closeDialog = useCallback(() => {
    viewControllerManager.accountMenuController.setDeletingAccount(false)
  }, [viewControllerManager.accountMenuController])

  const cancelRef = useRef<HTMLButtonElement>(null)

  const confirm = useCallback(() => {
    application.user.deleteAccount().catch(console.error)
    closeDialog()
  }, [application.user, closeDialog])

  return (
    <AlertDialog onDismiss={closeDialog} leastDestructiveRef={cancelRef} className="max-w-[600px] p-0">
      <div className="sk-modal-content">
        <div className="sn-component">
          <div className="sk-panel">
            <div className="sk-panel-content">
              <div className="sk-panel-section">
                <AlertDialogLabel className="flex items-center justify-between text-lg font-bold">
                  Delete account?
                  <button className="rounded p-1 font-bold hover:bg-contrast" onClick={closeDialog}>
                    <Icon type="close" />
                  </button>
                </AlertDialogLabel>
                <AlertDialogDescription className="sk-panel-row">
                  <div>
                    <p className="text-base text-foreground lg:text-sm">{STRING_DELETE_ACCOUNT_CONFIRMATION}</p>
                  </div>
                </AlertDialogDescription>

                <div className="my-1 mt-4 flex justify-end gap-2">
                  <Button ref={cancelRef} onClick={closeDialog}>
                    Cancel
                  </Button>
                  <Button primary colorStyle="danger" onClick={confirm}>
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

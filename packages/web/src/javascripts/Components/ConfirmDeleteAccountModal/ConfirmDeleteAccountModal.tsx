import { observer } from 'mobx-react-lite'
import { useCallback, useRef } from 'react'
import { STRING_DELETE_ACCOUNT_CONFIRMATION } from '@/Constants/Strings'
import Button from '@/Components/Button/Button'
import { WebApplication } from '@/Application/WebApplication'
import Icon from '../Icon/Icon'
import AlertDialog from '../AlertDialog/AlertDialog'

type Props = {
  application: WebApplication
}

const ConfirmDeleteAccountModal = ({ application }: Props) => {
  const closeDialog = useCallback(() => {
    application.accountMenuController.setDeletingAccount(false)
  }, [application.accountMenuController])

  const cancelRef = useRef<HTMLButtonElement>(null)

  const confirm = useCallback(() => {
    application.user.deleteAccount().catch(console.error)
    closeDialog()
  }, [application.user, closeDialog])

  return (
    <AlertDialog closeDialog={closeDialog}>
      <div className="flex items-center justify-between text-lg font-bold">
        Delete account?
        <button className="rounded p-1 font-bold hover:bg-contrast" onClick={closeDialog}>
          <Icon type="close" />
        </button>
      </div>
      <div className="sk-panel-row">
        <div>
          <p className="text-base text-foreground lg:text-sm">{STRING_DELETE_ACCOUNT_CONFIRMATION}</p>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button ref={cancelRef} onClick={closeDialog}>
          Cancel
        </Button>
        <Button primary colorStyle="danger" onClick={confirm}>
          Delete my account for good
        </Button>
      </div>
    </AlertDialog>
  )
}

ConfirmDeleteAccountModal.displayName = 'ConfirmDeleteAccountModal'

const ConfirmDeleteAccountContainer = (props: Props) => {
  if (!props.application.accountMenuController.deletingAccount) {
    return null
  }
  return <ConfirmDeleteAccountModal {...props} />
}

export default observer(ConfirmDeleteAccountContainer)

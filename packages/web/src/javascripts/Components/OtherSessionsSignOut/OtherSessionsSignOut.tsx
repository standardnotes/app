import { useCallback, useRef } from 'react'
import { WebApplication } from '@/Application/WebApplication'
import { observer } from 'mobx-react-lite'
import Button from '@/Components/Button/Button'
import Icon from '../Icon/Icon'
import AlertDialog from '../AlertDialog/AlertDialog'

type Props = {
  application: WebApplication
}

const ConfirmOtherSessionsSignOut = observer(({ application }: Props) => {
  const cancelRef = useRef<HTMLButtonElement>(null)

  const closeDialog = useCallback(() => {
    application.accountMenuController.setOtherSessionsSignOut(false)
  }, [application])

  const confirm = useCallback(() => {
    application.revokeAllOtherSessions().catch(console.error)
    closeDialog()
    application.alerts
      .alert('You have successfully revoked your sessions from other devices.', undefined, 'Finish')
      .catch(console.error)
  }, [application, closeDialog])

  return (
    <AlertDialog closeDialog={closeDialog}>
      <div className="flex items-center justify-between text-lg font-bold capitalize">
        End all other sessions?
        <button className="rounded p-1 font-bold hover:bg-contrast" onClick={closeDialog}>
          <Icon type="close" />
        </button>
      </div>
      <div className="sk-panel-row">
        <p className="text-base text-foreground lg:text-sm">
          This action will sign out all other devices signed into your account, and remove your data from those devices
          when they next regain connection to the internet. You may sign back in on those devices at any time.
        </p>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button ref={cancelRef} onClick={closeDialog}>
          Cancel
        </Button>
        <Button primary colorStyle="danger" onClick={confirm}>
          End Sessions
        </Button>
      </div>
    </AlertDialog>
  )
})

ConfirmOtherSessionsSignOut.displayName = 'ConfirmOtherSessionsSignOut'

const OtherSessionsSignOutContainer = (props: Props) => {
  if (!props.application.accountMenuController.otherSessionsSignOut) {
    return null
  }
  return <ConfirmOtherSessionsSignOut {...props} />
}

export default observer(OtherSessionsSignOutContainer)

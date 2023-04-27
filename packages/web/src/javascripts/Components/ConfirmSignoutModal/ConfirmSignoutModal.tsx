import { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react'
import { STRING_SIGN_OUT_CONFIRMATION } from '@/Constants/Strings'
import { WebApplication } from '@/Application/Application'
import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
import { observer } from 'mobx-react-lite'
import { ApplicationGroup } from '@/Application/ApplicationGroup'
import { isDesktopApplication } from '@/Utils'
import Button from '@/Components/Button/Button'
import Icon from '../Icon/Icon'
import AlertDialog from '../AlertDialog/AlertDialog'

type Props = {
  application: WebApplication
  viewControllerManager: ViewControllerManager
  applicationGroup: ApplicationGroup
}

const ConfirmSignoutModal: FunctionComponent<Props> = ({ application, viewControllerManager, applicationGroup }) => {
  const [deleteLocalBackups, setDeleteLocalBackups] = useState(false)

  const cancelRef = useRef<HTMLButtonElement>(null)
  const closeDialog = useCallback(() => {
    viewControllerManager.accountMenuController.setSigningOut(false)
  }, [viewControllerManager.accountMenuController])

  const [localBackupsCount, setLocalBackupsCount] = useState(0)

  useEffect(() => {
    application.desktopDevice?.getTextBackupsCount().then(setLocalBackupsCount).catch(console.error)
  }, [viewControllerManager.accountMenuController.signingOut, application.desktopDevice])

  const workspaces = applicationGroup.getDescriptors()
  const showWorkspaceWarning = workspaces.length > 1 && isDesktopApplication()

  const confirm = useCallback(() => {
    if (deleteLocalBackups) {
      application.signOutAndDeleteLocalBackups().catch(console.error)
    } else {
      application.user.signOut().catch(console.error)
    }
    closeDialog()
  }, [application, closeDialog, deleteLocalBackups])

  return (
    <AlertDialog closeDialog={closeDialog}>
      <div className="flex items-center justify-between text-lg font-bold">
        Sign out workspace?
        <button className="rounded p-1 font-bold hover:bg-contrast" onClick={closeDialog}>
          <Icon type="close" />
        </button>
      </div>
      <div className="sk-panel-row">
        <div>
          <p className="text-base text-foreground lg:text-sm">{STRING_SIGN_OUT_CONFIRMATION}</p>
          {showWorkspaceWarning && (
            <>
              <br />
              <p className="text-base text-foreground lg:text-sm">
                <strong>Note: </strong>
                Because you have other workspaces signed in, this sign out may leave logs and other metadata of your
                session on this device. For a more robust sign out that performs a hard clear of all app-related data,
                use the <i>Sign out all workspaces</i> option under <i>Switch workspace</i>.
              </p>
            </>
          )}
        </div>
      </div>

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
            className="sk-a ml-1.5 cursor-pointer rounded p-0 capitalize"
            onClick={() => {
              void application.desktopDevice?.viewTextBackups()
            }}
          >
            View backup files
          </button>
        </div>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <Button ref={cancelRef} onClick={closeDialog}>
          Cancel
        </Button>
        <Button primary colorStyle="danger" onClick={confirm}>
          {application.hasAccount() ? 'Sign Out' : 'Delete Workspace'}
        </Button>
      </div>
    </AlertDialog>
  )
}

ConfirmSignoutModal.displayName = 'ConfirmSignoutModal'

const ConfirmSignoutContainer = (props: Props) => {
  if (!props.viewControllerManager.accountMenuController.signingOut) {
    return null
  }
  return <ConfirmSignoutModal {...props} />
}

export default observer(ConfirmSignoutContainer)

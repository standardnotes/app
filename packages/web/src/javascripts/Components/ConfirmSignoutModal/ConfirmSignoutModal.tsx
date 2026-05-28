import { FunctionComponent, useCallback, useRef } from 'react'
import { STRING_SIGN_OUT_CONFIRMATION } from '@/Constants/Strings'
import { WebApplication } from '@/Application/WebApplication'
import { observer } from 'mobx-react-lite'
import { WebApplicationGroup } from '@/Application/WebApplicationGroup'
import { isDesktopApplication } from '@/Utils'
import Button from '@/Components/Button/Button'
import Icon from '../Icon/Icon'
import AlertDialog from '../AlertDialog/AlertDialog'
import HorizontalSeparator from '../Shared/HorizontalSeparator'
import { c } from 'ttag'

type Props = {
  application: WebApplication
  applicationGroup: WebApplicationGroup
}

const ConfirmSignoutModal: FunctionComponent<Props> = ({ application, applicationGroup }) => {
  const hasAnyBackupsEnabled =
    application.fileBackups?.isFilesBackupsEnabled() ||
    application.fileBackups?.isPlaintextBackupsEnabled() ||
    application.fileBackups?.isTextBackupsEnabled()

  const cancelRef = useRef<HTMLButtonElement>(null)
  const closeDialog = useCallback(() => {
    application.accountMenuController.setSigningOut(false)
  }, [application.accountMenuController])

  const workspaces = applicationGroup.getDescriptors()
  const showWorkspaceWarning = workspaces.length > 1 && isDesktopApplication()

  const confirm = useCallback(() => {
    application.user.signOut().catch(console.error)

    closeDialog()
  }, [application, closeDialog])

  return (
    <AlertDialog closeDialog={closeDialog}>
      <div className="flex items-center justify-between text-lg font-bold">
        {c('Title').t`Sign out workspace?`}
        <button className="rounded p-1 font-bold hover:bg-contrast" onClick={closeDialog}>
          <Icon type="close" />
        </button>
      </div>
      <div className="sk-panel-row">
        <div>
          <p className="text-base text-foreground lg:text-sm">{STRING_SIGN_OUT_CONFIRMATION()}</p>
          {showWorkspaceWarning && (
            <>
              <br />
              <p className="text-base text-foreground lg:text-sm">
                <strong>{c('Label').t`Note:`} </strong>
                {c('Info')
                  .t`Because you have other workspaces signed in, this sign out may leave logs and other metadata of your session on this device. For a more robust sign out that performs a hard clear of all app-related data, use the "Sign out all workspaces" option under "Switch workspace".`}
              </p>
            </>
          )}
        </div>
      </div>

      {hasAnyBackupsEnabled && (
        <>
          <HorizontalSeparator classes="my-2" />
          <div className="flex">
            <div className="sk-panel-row"></div>
            <div>
              <p className="text-base text-foreground lg:text-sm">
                {c('Info')
                  .t`Local backups are enabled for this workspace. Review your backup files manually to decide what to keep.`}
              </p>
              <button
                className="sk-a mt-2 cursor-pointer rounded p-0 capitalize lg:text-sm"
                onClick={() => {
                  void application.fileBackups?.openAllDirectoriesContainingBackupFiles()
                }}
              >
                {c('Action').t`View backup files`}
              </button>
            </div>
          </div>
        </>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <Button ref={cancelRef} onClick={closeDialog}>
          {c('Action').t`Cancel`}
        </Button>
        <Button primary colorStyle="danger" onClick={confirm}>
          {application.hasAccount() ? c('Action').t`Sign Out` : c('Action').t`Delete Workspace`}
        </Button>
      </div>
    </AlertDialog>
  )
}

ConfirmSignoutModal.displayName = 'ConfirmSignoutModal'

const ConfirmSignoutContainer = (props: Props) => {
  if (!props.application.accountMenuController.signingOut) {
    return null
  }
  return <ConfirmSignoutModal {...props} />
}

export default observer(ConfirmSignoutContainer)

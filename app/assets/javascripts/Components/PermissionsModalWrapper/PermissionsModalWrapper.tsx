import { WebApplication } from '@/UIModels/Application'
import { ApplicationEvent, PermissionDialog } from '@standardnotes/snjs'
import { FunctionComponent, useCallback, useEffect, useState } from 'react'
import { PermissionsModal } from '../PermissionsModal/PermissionsModal'

type Props = {
  application: WebApplication
}

export const PermissionsModalWrapper: FunctionComponent<Props> = ({ application }) => {
  const [dialog, setDialog] = useState<PermissionDialog>()

  const presentPermissionsDialog = useCallback((permissionDialog: PermissionDialog) => {
    setDialog(permissionDialog)
  }, [])

  const dismissPermissionsDialog = useCallback(() => {
    setDialog(undefined)
  }, [])

  const onAppStart = useCallback(() => {
    application.componentManager.presentPermissionsDialog = presentPermissionsDialog

    return () => {
      ;(application.componentManager.presentPermissionsDialog as unknown) = undefined
    }
  }, [application, presentPermissionsDialog])

  useEffect(() => {
    if (application.isStarted()) {
      onAppStart()
    }

    const removeAppObserver = application.addEventObserver(async (eventName) => {
      if (eventName === ApplicationEvent.Started) {
        onAppStart()
      }
    })

    return () => {
      removeAppObserver()
    }
  }, [application, onAppStart])

  return dialog ? (
    <PermissionsModal
      application={application}
      callback={dialog.callback}
      dismiss={dismissPermissionsDialog}
      component={dialog.component}
      permissionsString={dialog.permissionsString}
    />
  ) : null
}

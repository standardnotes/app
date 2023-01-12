import { WebApplication } from '@/Application/Application'
import { ApplicationEvent, PermissionDialog } from '@standardnotes/snjs'
import { FunctionComponent, useCallback, useEffect, useState } from 'react'
import ModalDialog from '../Shared/ModalDialog'
import PermissionsModalContent from './PermissionsModalContent'

type Props = {
  application: WebApplication
}

const PermissionsModalWrapper: FunctionComponent<Props> = ({ application }) => {
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

  return (
    <ModalDialog isOpen={!!dialog} close={dismissPermissionsDialog} className="w-full md:!w-[350px]">
      {dialog && (
        <PermissionsModalContent
          callback={dialog.callback}
          dismiss={dismissPermissionsDialog}
          component={dialog.component}
          permissionsString={dialog.permissionsString}
        />
      )}
    </ModalDialog>
  )
}

export default PermissionsModalWrapper

import { WebApplication } from '@/Application/WebApplication'
import { ApplicationEvent, PermissionDialog } from '@standardnotes/snjs'
import { FunctionComponent, useCallback, useEffect, useState } from 'react'
import ModalOverlay from '../Modal/ModalOverlay'
import PermissionsModal from './PermissionsModal'

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
    <ModalOverlay isOpen={!!dialog}>
      {dialog && (
        <PermissionsModal
          callback={dialog.callback}
          dismiss={dismissPermissionsDialog}
          component={dialog.component}
          permissionsString={dialog.permissionsString}
        />
      )}
    </ModalOverlay>
  )
}

export default PermissionsModalWrapper

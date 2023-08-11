import { ApplicationEvent, PermissionDialog } from '@standardnotes/snjs'
import { FunctionComponent, useCallback, useEffect, useState } from 'react'
import ModalOverlay from '../Modal/ModalOverlay'
import PermissionsModal from './PermissionsModal'
import { WebApplicationInterface } from '@standardnotes/ui-services'

type Props = {
  application: WebApplicationInterface
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
    application.componentManager.setPermissionDialogUIHandler(presentPermissionsDialog)
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
    <ModalOverlay isOpen={!!dialog} close={dismissPermissionsDialog} className="md:!w-[350px]">
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

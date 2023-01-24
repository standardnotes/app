import { FunctionComponent, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import PreferencesView from './PreferencesView'
import { PreferencesViewWrapperProps } from './PreferencesViewWrapperProps'
import { useCommandService } from '../CommandProvider'
import { OPEN_PREFERENCES_COMMAND } from '@standardnotes/ui-services'
import ModalOverlay from '../Shared/ModalOverlay'

const PreferencesViewWrapper: FunctionComponent<PreferencesViewWrapperProps> = ({
  viewControllerManager,
  application,
}) => {
  const commandService = useCommandService()

  useEffect(() => {
    return commandService.addCommandHandler({
      command: OPEN_PREFERENCES_COMMAND,
      onKeyDown: () => viewControllerManager.preferencesController.openPreferences(),
    })
  }, [commandService, viewControllerManager])

  return (
    <ModalOverlay isOpen={viewControllerManager.preferencesController?.isOpen} className="p-0">
      <PreferencesView
        closePreferences={() => viewControllerManager.preferencesController.closePreferences()}
        application={application}
        viewControllerManager={viewControllerManager}
        mfaProvider={application}
        userProvider={application}
      />
    </ModalOverlay>
  )
}

export default observer(PreferencesViewWrapper)

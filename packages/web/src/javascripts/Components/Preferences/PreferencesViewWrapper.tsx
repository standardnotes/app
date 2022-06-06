import { FunctionComponent } from 'react'
import { observer } from 'mobx-react-lite'
import PreferencesView from './PreferencesView'
import { PreferencesViewWrapperProps } from './PreferencesViewWrapperProps'

const PreferencesViewWrapper: FunctionComponent<PreferencesViewWrapperProps> = ({
  viewControllerManager,
  application,
}) => {
  if (!viewControllerManager.preferencesController?.isOpen) {
    return null
  }

  return (
    <PreferencesView
      closePreferences={() => viewControllerManager.preferencesController.closePreferences()}
      application={application}
      viewControllerManager={viewControllerManager}
      mfaProvider={application}
      userProvider={application}
    />
  )
}

export default observer(PreferencesViewWrapper)

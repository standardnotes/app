import { FunctionComponent } from 'react'
import { observer } from 'mobx-react-lite'
import PreferencesView from './PreferencesView'
import { PreferencesViewWrapperProps } from './PreferencesViewWrapperProps'

const PreferencesViewWrapper: FunctionComponent<PreferencesViewWrapperProps> = ({ appState, application }) => {
  if (!appState.preferences?.isOpen) {
    return null
  }

  return (
    <PreferencesView
      closePreferences={() => appState.preferences.closePreferences()}
      application={application}
      appState={appState}
      mfaProvider={application}
      userProvider={application}
    />
  )
}

export default observer(PreferencesViewWrapper)

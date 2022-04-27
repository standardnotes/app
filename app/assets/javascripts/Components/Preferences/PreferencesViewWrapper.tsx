import { FunctionComponent } from 'preact'
import { observer } from 'mobx-react-lite'
import { WebApplication } from '@/UIModels/Application'
import { PreferencesView } from './PreferencesView'
import { AppState } from '@/UIModels/AppState'

export interface PreferencesViewWrapperProps {
  appState: AppState
  application: WebApplication
}

export const PreferencesViewWrapper: FunctionComponent<PreferencesViewWrapperProps> = observer(
  ({ appState, application }) => {
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
  },
)

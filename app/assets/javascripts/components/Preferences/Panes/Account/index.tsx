import { PreferencesPane } from '@/components/Preferences/Components'
import { observer } from 'mobx-react-lite'
import { WebApplication } from '@/ui_models/application'
import { AppState } from '@/ui_models/app_state'
import { Authentication } from './Authentication'
import { Credentials } from './Credentials'
import { Sync } from './Sync'
import { Subscription } from './Subscription/Subscription'
import { SignOutWrapper } from './SignOutView'

type Props = {
  application: WebApplication
  appState: AppState
}

export const AccountPreferences = observer(({ application, appState }: Props) => (
  <PreferencesPane>
    {!application.hasAccount() ? (
      <Authentication application={application} appState={appState} />
    ) : (
      <>
        <Credentials application={application} appState={appState} />
        <Sync application={application} />
      </>
    )}
    <Subscription application={application} appState={appState} />
    <SignOutWrapper application={application} appState={appState} />
  </PreferencesPane>
))

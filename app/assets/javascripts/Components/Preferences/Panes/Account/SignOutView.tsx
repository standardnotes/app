import Button from '@/Components/Button/Button'
import OtherSessionsSignOutContainer from '@/Components/OtherSessionsSignOut/OtherSessionsSignOut'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import { WebApplication } from '@/UIModels/Application'
import { AppState } from '@/UIModels/AppState'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import { Subtitle, Title, Text } from '../../PreferencesComponents/Content'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'
import ClearSessionDataView from './ClearSessionDataView'

type Props = {
  application: WebApplication
  appState: AppState
}

const SignOutView: FunctionComponent<Props> = observer(({ application, appState }) => {
  return (
    <>
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>Sign out</Title>
          <Subtitle>Other devices</Subtitle>
          <Text>Want to sign out on all devices except this one?</Text>
          <div className="min-h-3" />
          <div className="flex flex-row">
            <Button
              className="mr-3"
              variant="normal"
              label="Sign out other sessions"
              onClick={() => {
                appState.accountMenu.setOtherSessionsSignOut(true)
              }}
            />
            <Button variant="normal" label="Manage sessions" onClick={() => appState.openSessionsModal()} />
          </div>
        </PreferencesSegment>
        <HorizontalSeparator classes="my-4" />
        <PreferencesSegment>
          <Subtitle>This workspace</Subtitle>
          <Text>Remove all data related to the current workspace from the application.</Text>
          <div className="min-h-3" />
          <Button
            dangerStyle={true}
            label="Sign out workspace"
            onClick={() => {
              appState.accountMenu.setSigningOut(true)
            }}
          />
        </PreferencesSegment>
      </PreferencesGroup>
      <OtherSessionsSignOutContainer appState={appState} application={application} />
    </>
  )
})

SignOutView.displayName = 'SignOutView'

const SignOutWrapper: FunctionComponent<Props> = ({ application, appState }) => {
  if (!application.hasAccount()) {
    return <ClearSessionDataView appState={appState} />
  }
  return <SignOutView appState={appState} application={application} />
}

export default observer(SignOutWrapper)

import Button from '@/Components/Button/Button'
import OtherSessionsSignOutContainer from '@/Components/OtherSessionsSignOut/OtherSessionsSignOut'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import { WebApplication } from '@/Application/Application'
import { ViewControllerManager } from '@/Services/ViewControllerManager'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import { Subtitle, Title, Text } from '../../PreferencesComponents/Content'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'
import ClearSessionDataView from './ClearSessionDataView'

type Props = {
  application: WebApplication
  viewControllerManager: ViewControllerManager
}

const SignOutView: FunctionComponent<Props> = observer(({ application, viewControllerManager }) => {
  return (
    <>
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>Sign out</Title>
          <Subtitle>Other devices</Subtitle>
          <Text>Want to sign out on all devices except this one?</Text>
          <div className="flex flex-row mt-3">
            <Button
              className="mr-3"
              variant="normal"
              label="Sign out other sessions"
              onClick={() => {
                viewControllerManager.accountMenuController.setOtherSessionsSignOut(true)
              }}
            />
            <Button
              variant="normal"
              label="Manage sessions"
              onClick={() => viewControllerManager.openSessionsModal()}
            />
          </div>
        </PreferencesSegment>
        <HorizontalSeparator classes="my-4" />
        <PreferencesSegment>
          <Subtitle>This workspace</Subtitle>
          <Text>Remove all data related to the current workspace from the application.</Text>
          <Button
            className="mt-3"
            dangerStyle={true}
            label="Sign out workspace"
            onClick={() => {
              viewControllerManager.accountMenuController.setSigningOut(true)
            }}
          />
        </PreferencesSegment>
      </PreferencesGroup>
      <OtherSessionsSignOutContainer viewControllerManager={viewControllerManager} application={application} />
    </>
  )
})

SignOutView.displayName = 'SignOutView'

const SignOutWrapper: FunctionComponent<Props> = ({ application, viewControllerManager }) => {
  if (!application.hasAccount()) {
    return <ClearSessionDataView viewControllerManager={viewControllerManager} />
  }
  return <SignOutView viewControllerManager={viewControllerManager} application={application} />
}

export default observer(SignOutWrapper)

import Button from '@/Components/Button/Button'
import OtherSessionsSignOutContainer from '@/Components/OtherSessionsSignOut/OtherSessionsSignOut'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import { WebApplication } from '@/Application/WebApplication'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import { Subtitle, Title, Text } from '../../PreferencesComponents/Content'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'
import ClearSessionDataView from './ClearSessionDataView'
import { c } from 'ttag'

type Props = {
  application: WebApplication
}

const SignOutView: FunctionComponent<Props> = observer(({ application }) => {
  return (
    <>
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>{c('Title').t`Sign out`}</Title>
          <Subtitle>{c('Subtitle').t`Other devices`}</Subtitle>
          <Text>{c('Info').t`Want to sign out on all devices except this one?`}</Text>
          <div className="mt-3 flex flex-row flex-wrap gap-3">
            <Button
              label={c('Action').t`Sign out other sessions`}
              onClick={() => {
                application.accountMenuController.setOtherSessionsSignOut(true)
              }}
            />
            <Button label={c('Action').t`Manage sessions`} onClick={() => application.openSessionsModal()} />
          </div>
        </PreferencesSegment>
        <HorizontalSeparator classes="my-4" />
        <PreferencesSegment>
          <Subtitle>{c('Subtitle').t`This workspace`}</Subtitle>
          <Text>{c('Info').t`Remove all data related to the current workspace from the application.`}</Text>
          <Button
            className="mt-3"
            colorStyle="danger"
            label={c('Action').t`Sign out workspace`}
            onClick={() => {
              application.accountMenuController.setSigningOut(true)
            }}
          />
        </PreferencesSegment>
      </PreferencesGroup>
      <OtherSessionsSignOutContainer application={application} />
    </>
  )
})

SignOutView.displayName = 'SignOutView'

const SignOutWrapper: FunctionComponent<Props> = ({ application }) => {
  if (!application.hasAccount()) {
    return <ClearSessionDataView />
  }
  return <SignOutView application={application} />
}

export default observer(SignOutWrapper)

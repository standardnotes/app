import { Title } from '@/Components/Preferences/PreferencesComponents/Content'
import { FunctionComponent } from 'react'
import { c } from 'ttag'

const InviteSuccess: FunctionComponent = () => {
  return (
    <div>
      <Title className="mb-2">{c('B6.Preferences.Subscription.Status').t`Invite processed successfully.`}</Title>
      <div className={'mt-2'}>
        {c('B6.Preferences.Subscription.Info')
          .t`If an account is found with that email, they will receive an email with your invitation.`}
      </div>
    </div>
  )
}

export default InviteSuccess

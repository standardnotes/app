import { Title } from '@/Components/Preferences/PreferencesComponents/Content'
import { FunctionComponent } from 'react'

const InviteSuccess: FunctionComponent = () => {
  return (
    <div>
      <Title className="mb-2">Invite processed successfully.</Title>
      <div className={'mt-2'}>
        If an account is found with that email, they will receive an email with your invitation.
      </div>
    </div>
  )
}

export default InviteSuccess

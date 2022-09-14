import { observer } from 'mobx-react-lite'

import { SubtitleLight, Text } from '@/Components/Preferences/PreferencesComponents/Content'
import { SubscriptionController } from '@/Controllers/Subscription/SubscriptionController'

type Props = { subscriptionState: SubscriptionController }

const InvitationsList = ({ subscriptionState }: Props) => {
  const {
    usedInvitationsCount,
    subscriptionInvitations,
  } = subscriptionState

  if (usedInvitationsCount === 0) {
    return (
      <Text className="mt-1">
        Make your first subscription invitation below.
      </Text>
    )
  }

  return (
    <div>
      <SubtitleLight>Invitations:</SubtitleLight>
      {subscriptionInvitations?.map(invitation => (
        <Text className="mt-1">{invitation.inviteeIdentifier} ({invitation.status})</Text>
      ))}
    </div>
  )
}

export default observer(InvitationsList)

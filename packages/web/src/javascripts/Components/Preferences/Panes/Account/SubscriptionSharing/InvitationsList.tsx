import { observer } from 'mobx-react-lite'

import { Text } from '@/Components/Preferences/PreferencesComponents/Content'
import { SubscriptionController } from '@/Controllers/Subscription/SubscriptionController'

type Props = { subscriptionState: SubscriptionController }

const InvitationsList = ({ subscriptionState }: Props) => {
  const {
    usedInvitationsCount,
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

    </div>
  )
}

export default observer(InvitationsList)

import { SubscriptionController } from '@/Controllers/Subscription/SubscriptionController'
import { observer } from 'mobx-react-lite'
import { Text } from '@/Components/Preferences/PreferencesComponents/Content'

type Props = { subscriptionState: SubscriptionController }

const SharingStatusText = ({ subscriptionState }: Props) => {
  const { usedInvitationsCount, allowedInvitationsCount } = subscriptionState

  return (
    <Text className="mt-1">
      You've used <span className="font-bold">{usedInvitationsCount}</span> out of {allowedInvitationsCount}{' '}
      subscription invites.
    </Text>
  )
}

export default observer(SharingStatusText)

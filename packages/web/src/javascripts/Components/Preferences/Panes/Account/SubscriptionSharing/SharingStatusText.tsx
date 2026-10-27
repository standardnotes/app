import { SubscriptionController } from '@/Controllers/Subscription/SubscriptionController'
import { observer } from 'mobx-react-lite'
import { Text } from '@/Components/Preferences/PreferencesComponents/Content'
import { c } from 'ttag'

type Props = { subscriptionState: SubscriptionController }

const SharingStatusText = ({ subscriptionState }: Props) => {
  const { usedInvitationsCount, allowedInvitationsCount } = subscriptionState

  const usedInvitationsCountBold = <span className="font-bold">{usedInvitationsCount}</span>

  return (
    <Text className="mt-1">
      {c('B6.Preferences.Subscription.Info')
        .jt`You've used ${usedInvitationsCountBold} out of ${allowedInvitationsCount} subscription invites.`}
    </Text>
  )
}

export default observer(SharingStatusText)

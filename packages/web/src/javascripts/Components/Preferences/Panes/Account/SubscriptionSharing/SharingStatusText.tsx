import { SubscriptionController } from '@/Controllers/Subscription/SubscriptionController'
import { observer } from 'mobx-react-lite'
import { Text } from '@/Components/Preferences/PreferencesComponents/Content'
import { c, msgid } from 'ttag'

type Props = { subscriptionState: SubscriptionController }

const SharingStatusText = ({ subscriptionState }: Props) => {
  const { usedInvitationsCount, allowedInvitationsCount } = subscriptionState

  const text = c('B6.Preferences.Subscription.Info').ngettext(
    msgid`You've used ${usedInvitationsCount} out of ${allowedInvitationsCount} subscription invite.`,
    `You've used ${usedInvitationsCount} out of ${allowedInvitationsCount} subscription invites.`,
    allowedInvitationsCount,
  )

  return <Text className="mt-1">{text}</Text>
}

export default observer(SharingStatusText)

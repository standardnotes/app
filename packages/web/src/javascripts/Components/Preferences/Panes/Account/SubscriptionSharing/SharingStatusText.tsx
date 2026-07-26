import { SubscriptionController } from '@/Controllers/Subscription/SubscriptionController'
import { observer } from 'mobx-react-lite'
import { Text } from '@/Components/Preferences/PreferencesComponents/Content'
import { c } from 'ttag'

type Props = { subscriptionState: SubscriptionController }

const SharingStatusText = ({ subscriptionState }: Props) => {
  const { usedInvitationsCount, allowedInvitationsCount } = subscriptionState

  return (
    <Text className="mt-1">
      {c('B7.FilesSubscriptionHelp.Subscription.Info').t`You've used`}{' '}
      <span className="font-bold">{usedInvitationsCount}</span> {c('B7.FilesSubscriptionHelp.Subscription.Info').t`out of`}{' '}
      {allowedInvitationsCount} {c('B7.FilesSubscriptionHelp.Subscription.Info').t`subscription invites.`}
    </Text>
  )
}

export default observer(SharingStatusText)

import { observer } from 'mobx-react-lite'
import { Text } from '@/Components/Preferences/PreferencesComponents/Content'
import { useApplication } from '@/Components/ApplicationProvider'
import { AppName } from '@standardnotes/features'
import { c } from 'ttag'

const SubscriptionStatusText = () => {
  const application = useApplication()

  const {
    userSubscriptionName,
    userSubscriptionExpirationDate,
    isUserSubscriptionExpired,
    isUserSubscriptionCanceled,
  } = application.subscriptions
  const isSharedSubscription = application.subscriptionController.isSharedSubscription

  const expirationDateString = userSubscriptionExpirationDate?.toLocaleString()
  const sharedMessage = isSharedSubscription ? (
    <>
      <br />
      <br />
      {c('B6.Preferences.Subscription.Info')
        .t`This subscription has been shared with you and can only be managed by the owner.`}
    </>
  ) : null

  if (isUserSubscriptionCanceled) {
    return (
      <Text className="mt-1">
        {c('B6.Preferences.Subscription.Info').t`Your`}{' '}
        <span className="font-bold">
          {AppName}
          {userSubscriptionName ? ' ' : ''}
          {userSubscriptionName}
        </span>{' '}
        {c('B6.Preferences.Subscription.Info').t`subscription has been canceled`}{' '}
        {isUserSubscriptionExpired ? (
          <span className="font-bold">
            {c('B6.Preferences.Subscription.Info').t`and expired on`} {expirationDateString}
          </span>
        ) : (
          <span className="font-bold">
            {c('B6.Preferences.Subscription.Info').t`but will remain valid until`} {expirationDateString}
          </span>
        )}
        {c('B6.Preferences.Subscription.Info').t`. You may resubscribe below if you wish.`}
        {sharedMessage}
      </Text>
    )
  }

  if (isUserSubscriptionExpired) {
    return (
      <Text className="mt-1">
        {c('B6.Preferences.Subscription.Info').t`Your`}{' '}
        <span className="font-bold">
          {AppName}
          {userSubscriptionName ? ' ' : ''}
          {userSubscriptionName}
        </span>{' '}
        {c('B6.Preferences.Subscription.Info').t`subscription`}{' '}
        <span className="font-bold">
          {c('B6.Preferences.Subscription.Info').t`expired on`} {expirationDateString}
        </span>
        {c('B6.Preferences.Subscription.Info').t`. You may resubscribe below if you wish.`}
        {sharedMessage}
      </Text>
    )
  }

  return (
    <Text className="mt-1">
      {c('B6.Preferences.Subscription.Info').t`Your`}{' '}
      <span className="font-bold">
        {AppName}
        {userSubscriptionName ? ' ' : ''}
        {userSubscriptionName}
      </span>{' '}
      {c('B6.Preferences.Subscription.Info').t`subscription will be`}{' '}
      <span className="font-bold">
        {c('B6.Preferences.Subscription.Info').t`renewed on`} {expirationDateString}
      </span>
      .{sharedMessage}
    </Text>
  )
}

export default observer(SubscriptionStatusText)

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
  const appNameBold = <span className="font-bold">{AppName}</span>
  const subscriptionTierBold = userSubscriptionName ? <span className="font-bold"> {userSubscriptionName}</span> : null
  const expirationDateBold = <span className="font-bold">{expirationDateString}</span>

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
        {isUserSubscriptionExpired
          ? c('B6.Preferences.Subscription.Info')
              .jt`Your ${appNameBold}${subscriptionTierBold} subscription has been canceled and expired on ${expirationDateBold}. You may resubscribe below if you wish.`
          : c('B6.Preferences.Subscription.Info')
              .jt`Your ${appNameBold}${subscriptionTierBold} subscription has been canceled but will remain valid until ${expirationDateBold}. You may resubscribe below if you wish.`}
        {sharedMessage}
      </Text>
    )
  }

  if (isUserSubscriptionExpired) {
    return (
      <Text className="mt-1">
        {c('B6.Preferences.Subscription.Info')
          .jt`Your ${appNameBold}${subscriptionTierBold} subscription expired on ${expirationDateBold}. You may resubscribe below if you wish.`}
        {sharedMessage}
      </Text>
    )
  }

  return (
    <Text className="mt-1">
      {c('B6.Preferences.Subscription.Info')
        .jt`Your ${appNameBold}${subscriptionTierBold} subscription will be renewed on ${expirationDateBold}.`}
      {sharedMessage}
    </Text>
  )
}

export default observer(SubscriptionStatusText)

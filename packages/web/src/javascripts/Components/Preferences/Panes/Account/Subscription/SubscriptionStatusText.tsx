import { observer } from 'mobx-react-lite'
import { Text } from '@/Components/Preferences/PreferencesComponents/Content'
import { useApplication } from '@/Components/ApplicationProvider'
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
      {c('Info').t`This subscription has been shared with you and can only be managed by the owner.`}
    </>
  ) : null

  const planName = `Standard Notes${userSubscriptionName ? ` ${userSubscriptionName}` : ''}`
  const planNameSpan = <span className="font-bold">{planName}</span>
  const dateSpan = <span className="font-bold">{expirationDateString}</span>

  if (isUserSubscriptionCanceled) {
    if (isUserSubscriptionExpired) {
      return (
        <Text className="mt-1">
          {c('Info')
            .jt`Your ${planNameSpan} subscription has been canceled and expired on ${dateSpan}. You may resubscribe below if you wish.`}
          {sharedMessage}
        </Text>
      )
    }
    return (
      <Text className="mt-1">
        {c('Info')
          .jt`Your ${planNameSpan} subscription has been canceled but will remain valid until ${dateSpan}. You may resubscribe below if you wish.`}
        {sharedMessage}
      </Text>
    )
  }

  if (isUserSubscriptionExpired) {
    return (
      <Text className="mt-1">
        {c('Info').jt`Your ${planNameSpan} subscription expired on ${dateSpan}. You may resubscribe below if you wish.`}
        {sharedMessage}
      </Text>
    )
  }

  return (
    <Text className="mt-1">
      {c('Info').jt`Your ${planNameSpan} subscription will be renewed on ${dateSpan}.`}
      {sharedMessage}
    </Text>
  )
}

export default observer(SubscriptionStatusText)

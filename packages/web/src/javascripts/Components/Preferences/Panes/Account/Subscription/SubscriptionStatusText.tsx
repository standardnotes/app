import { observer } from 'mobx-react-lite'
import { Text } from '@/Components/Preferences/PreferencesComponents/Content'
import { useApplication } from '@/Components/ApplicationProvider'

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
      This subscription has been shared with you and can only be managed by the owner.
    </>
  ) : null

  if (isUserSubscriptionCanceled) {
    return (
      <Text className="mt-1">
        Your{' '}
        <span className="font-bold">
          Standard Notes{userSubscriptionName ? ' ' : ''}
          {userSubscriptionName}
        </span>{' '}
        subscription has been canceled{' '}
        {isUserSubscriptionExpired ? (
          <span className="font-bold">and expired on {expirationDateString}</span>
        ) : (
          <span className="font-bold">but will remain valid until {expirationDateString}</span>
        )}
        . You may resubscribe below if you wish.
        {sharedMessage}
      </Text>
    )
  }

  if (isUserSubscriptionExpired) {
    return (
      <Text className="mt-1">
        Your{' '}
        <span className="font-bold">
          Standard Notes{userSubscriptionName ? ' ' : ''}
          {userSubscriptionName}
        </span>{' '}
        subscription <span className="font-bold">expired on {expirationDateString}</span>. You may resubscribe below if
        you wish.
        {sharedMessage}
      </Text>
    )
  }

  return (
    <Text className="mt-1">
      Your{' '}
      <span className="font-bold">
        Standard Notes{userSubscriptionName ? ' ' : ''}
        {userSubscriptionName}
      </span>{' '}
      subscription will be <span className="font-bold">renewed on {expirationDateString}</span>.{sharedMessage}
    </Text>
  )
}

export default observer(SubscriptionStatusText)

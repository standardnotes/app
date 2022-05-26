import { SubscriptionState } from '@/UIModels/AppState/SubscriptionState'
import { observer } from 'mobx-react-lite'
import { Text } from '@/Components/Preferences/PreferencesComponents/Content'

type Props = { subscriptionState: SubscriptionState }

const StatusText = ({ subscriptionState }: Props) => {
  const {
    userSubscriptionName,
    userSubscriptionExpirationDate,
    isUserSubscriptionExpired,
    isUserSubscriptionCanceled,
  } = subscriptionState
  const expirationDateString = userSubscriptionExpirationDate?.toLocaleString()

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
      subscription will be <span className="font-bold">renewed on {expirationDateString}</span>.
    </Text>
  )
}

export default observer(StatusText)

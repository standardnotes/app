import { observer } from 'mobx-react-lite'

import { SubscriptionController } from '@/Controllers/Subscription/SubscriptionController'

import SharingStatusText from './SharingStatusText'

type Props = {
  subscriptionState: SubscriptionController
}

const SubscriptionSharingInformation = ({ subscriptionState }: Props) => {
  return (
    <>
      <SharingStatusText subscriptionState={subscriptionState} />
    </>
  )
}

export default observer(SubscriptionSharingInformation)

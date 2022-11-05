import { observer } from 'mobx-react-lite'
import { SubscriptionController } from '@/Controllers/Subscription/SubscriptionController'
import Button from '@/Components/Button/Button'
import { WebApplication } from '@/Application/Application'
import { openSubscriptionDashboard } from '@/Utils/ManageSubscription'
import StatusText from './StatusText'

type Props = {
  subscriptionState: SubscriptionController
  application: WebApplication
}

const SubscriptionInformation = ({ subscriptionState, application }: Props) => {
  const manageSubscription = async () => {
    void openSubscriptionDashboard(application)
  }

  return (
    <>
      <StatusText subscriptionState={subscriptionState} />
      <Button className="mt-3 mr-3 min-w-20" label="Manage subscription" onClick={manageSubscription} />
    </>
  )
}

export default observer(SubscriptionInformation)

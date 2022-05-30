import { observer } from 'mobx-react-lite'
import { SubscriptionState } from '@/UIModels/AppState/SubscriptionState'
import Button from '@/Components/Button/Button'
import { WebApplication } from '@/UIModels/Application'
import { openSubscriptionDashboard } from '@/Utils/ManageSubscription'
import StatusText from './StatusText'

type Props = {
  subscriptionState: SubscriptionState
  application: WebApplication
}

const SubscriptionInformation = ({ subscriptionState, application }: Props) => {
  const manageSubscription = async () => {
    openSubscriptionDashboard(application)
  }

  return (
    <>
      <StatusText subscriptionState={subscriptionState} />
      <Button
        className="min-w-20 mt-3 mr-3"
        variant="normal"
        label="Manage subscription"
        onClick={manageSubscription}
      />
    </>
  )
}

export default observer(SubscriptionInformation)

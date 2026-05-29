import { observer } from 'mobx-react-lite'
import Button from '@/Components/Button/Button'
import SubscriptionStatusText from './SubscriptionStatusText'
import { useApplication } from '@/Components/ApplicationProvider'
import { c } from 'ttag'

const SubscriptionInformation = () => {
  const application = useApplication()
  const isSharedSubscription = application.subscriptionController.isSharedSubscription

  const manageSubscription = async () => {
    void application.openSubscriptionDashboard.execute()
  }

  return (
    <>
      <SubscriptionStatusText />
      {!isSharedSubscription && (
        <Button
          className="mr-3 mt-3 min-w-20"
          label={c('Action').t`Manage subscription`}
          onClick={manageSubscription}
        />
      )}
    </>
  )
}

export default observer(SubscriptionInformation)

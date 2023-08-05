import { observer } from 'mobx-react-lite'
import Button from '@/Components/Button/Button'
import SubscriptionStatusText from './SubscriptionStatusText'
import { useApplication } from '@/Components/ApplicationProvider'

const SubscriptionInformation = () => {
  const application = useApplication()

  const manageSubscription = async () => {
    void application.openSubscriptionDashboard.execute()
  }

  return (
    <>
      <SubscriptionStatusText />
      <Button className="mr-3 mt-3 min-w-20" label="Manage subscription" onClick={manageSubscription} />
    </>
  )
}

export default observer(SubscriptionInformation)

import { Title } from '@/Components/Preferences/PreferencesComponents/Content'
import SubscriptionInformation from './SubscriptionInformation'
import NoSubscription from './NoSubscription'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import PreferencesGroup from '@/Components/Preferences/PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '@/Components/Preferences/PreferencesComponents/PreferencesSegment'
import { useApplication } from '@/Components/ApplicationProvider'

const Subscription: FunctionComponent = () => {
  const application = useApplication()

  const onlineSubscription = application.controllers.subscriptionController.onlineSubscription

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <div className="flex flex-row items-center">
          <div className="flex flex-grow flex-col">
            <Title>Subscription</Title>
            {onlineSubscription ? <SubscriptionInformation /> : <NoSubscription application={application} />}
          </div>
        </div>
      </PreferencesSegment>
    </PreferencesGroup>
  )
}

export default observer(Subscription)

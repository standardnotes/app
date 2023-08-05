import { Title } from '@/Components/Preferences/PreferencesComponents/Content'
import SubscriptionInformation from './SubscriptionInformation'
import NoSubscription from './NoSubscription'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useEffect, useState } from 'react'
import PreferencesGroup from '@/Components/Preferences/PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '@/Components/Preferences/PreferencesComponents/PreferencesSegment'
import { useApplication } from '@/Components/ApplicationProvider'
import { SubscriptionManagerEvent, Subscription } from '@standardnotes/snjs'

const Subscription: FunctionComponent = () => {
  const application = useApplication()

  const [onlineSubscription, setOnlineSubscription] = useState<Subscription | undefined>(
    application.subscriptionController.onlineSubscription,
  )

  useEffect(() => {
    return application.subscriptions.addEventObserver((event) => {
      if (event === SubscriptionManagerEvent.DidFetchSubscription) {
        setOnlineSubscription(application.subscriptionController.onlineSubscription)
      }
    })
  }, [application.subscriptions, application.subscriptionController])

  useEffect(() => {
    void application.subscriptions.fetchOnlineSubscription()
  }, [application.subscriptions])

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

import { Title } from '@/Components/Preferences/PreferencesComponents/Content'
import { WebApplication } from '@/Application/WebApplication'
import SubscriptionInformation from './SubscriptionInformation'
import NoSubscription from './NoSubscription'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
import PreferencesGroup from '@/Components/Preferences/PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '@/Components/Preferences/PreferencesComponents/PreferencesSegment'

type Props = {
  application: WebApplication
  viewControllerManager: ViewControllerManager
}

const Subscription: FunctionComponent<Props> = ({ application, viewControllerManager }: Props) => {
  const subscriptionState = viewControllerManager.subscriptionController
  const { onlineSubscription } = subscriptionState

  const now = new Date().getTime()

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <div className="flex flex-row items-center">
          <div className="flex flex-grow flex-col">
            <Title>Subscription</Title>
            {onlineSubscription && onlineSubscription.endsAt > now ? (
              <SubscriptionInformation subscriptionState={subscriptionState} application={application} />
            ) : (
              <NoSubscription application={application} />
            )}
          </div>
        </div>
      </PreferencesSegment>
    </PreferencesGroup>
  )
}

export default observer(Subscription)

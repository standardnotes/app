import { FeatureStatus, FeatureIdentifier } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useState } from 'react'

import { Title } from '@/Components/Preferences/PreferencesComponents/Content'
import { WebApplication } from '@/Application/Application'
import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
import PreferencesGroup from '@/Components/Preferences/PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '@/Components/Preferences/PreferencesComponents/PreferencesSegment'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'

import SubscriptionSharingInformation from './SubscriptionSharingInformation'
import NoProSubscription from './NoProSubscription'
import InvitationsList from './InvitationsList'
import Invite from './Invite/Invite'
import Button from '@/Components/Button/Button'


type Props = {
  application: WebApplication
  viewControllerManager: ViewControllerManager
}

const SubscriptionSharing: FunctionComponent<Props> = ({ application, viewControllerManager }: Props) => {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)

  const subscriptionState = viewControllerManager.subscriptionController

  const isSubscriptionSharingFeatureAvailable = application.features.getFeatureStatus(FeatureIdentifier.TwoFactorAuth) === FeatureStatus.Entitled

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <div className="flex flex-row items-center">
          <div className="flex flex-grow flex-col">
            <Title>Subscription Sharing</Title>
            {isSubscriptionSharingFeatureAvailable ? (
              <div>
                <SubscriptionSharingInformation subscriptionState={subscriptionState} />
                <HorizontalSeparator classes="my-4" />
                <InvitationsList subscriptionState={subscriptionState} />
                <HorizontalSeparator classes="my-4" />
                <Button
                  className="mt-3 min-w-20"
                  label="Invite"
                  onClick={() => { setIsInviteDialogOpen(true) }}
                />
                {isInviteDialogOpen && (
                  <Invite onCloseDialog={() => setIsInviteDialogOpen(false)} application={application} />
                )}
              </div>
            ) : (
              <NoProSubscription application={application} />
            )}
          </div>
        </div>
      </PreferencesSegment>
    </PreferencesGroup>
  )
}

export default observer(SubscriptionSharing)

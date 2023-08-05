import { FeatureStatus, NativeFeatureIdentifier } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useState } from 'react'
import { Title } from '@/Components/Preferences/PreferencesComponents/Content'
import { WebApplication } from '@/Application/WebApplication'
import PreferencesGroup from '@/Components/Preferences/PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '@/Components/Preferences/PreferencesComponents/PreferencesSegment'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'

import NoProSubscription from '../NoProSubscription'
import InvitationsList from './InvitationsList'
import Invite from './Invite/Invite'
import Button from '@/Components/Button/Button'
import SharingStatusText from './SharingStatusText'
import ModalOverlay from '@/Components/Modal/ModalOverlay'

type Props = {
  application: WebApplication
}

const SubscriptionSharing: FunctionComponent<Props> = ({ application }: Props) => {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)

  const subscriptionState = application.subscriptionController

  const isReadOnlySession = application.sessions.isCurrentSessionReadOnly()

  const isSubscriptionSharingFeatureAvailable =
    application.features.getFeatureStatus(
      NativeFeatureIdentifier.create(NativeFeatureIdentifier.TYPES.SubscriptionSharing).getValue(),
    ) === FeatureStatus.Entitled && !isReadOnlySession

  const closeInviteDialog = () => setIsInviteDialogOpen(false)

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <div className="flex flex-row items-center">
          <div className="flex flex-grow flex-col">
            <Title className="mb-2">Subscription sharing</Title>
            {isSubscriptionSharingFeatureAvailable ? (
              <div>
                <SharingStatusText subscriptionState={subscriptionState} />
                <HorizontalSeparator classes="my-4" />
                <InvitationsList subscriptionState={subscriptionState} application={application} />
                {!subscriptionState.allInvitationsUsed && (
                  <Button className="min-w-20" label="Invite" onClick={() => setIsInviteDialogOpen(true)} />
                )}
                <ModalOverlay isOpen={isInviteDialogOpen} close={closeInviteDialog}>
                  <Invite
                    onCloseDialog={closeInviteDialog}
                    application={application}
                    subscriptionState={subscriptionState}
                  />
                </ModalOverlay>
              </div>
            ) : (
              <NoProSubscription
                application={application}
                text={
                  <span>
                    Subscription sharing is available only on the <span className="font-bold">Professional</span> plan.
                    Please upgrade in order to share your subscription.
                  </span>
                }
              />
            )}
          </div>
        </div>
      </PreferencesSegment>
    </PreferencesGroup>
  )
}

export default observer(SubscriptionSharing)

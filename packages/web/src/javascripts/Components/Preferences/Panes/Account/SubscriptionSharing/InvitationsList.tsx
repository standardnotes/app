import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { InvitationStatus, Uuid } from '@standardnotes/snjs'

import { SubtitleLight, Text } from '@/Components/Preferences/PreferencesComponents/Content'
import { SubscriptionController } from '@/Controllers/Subscription/SubscriptionController'
import Button from '@/Components/Button/Button'
import { WebApplication } from '@/Application/Application'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'

type Props = {
  subscriptionState: SubscriptionController
  application: WebApplication
}

const InvitationsList = ({ subscriptionState, application }: Props) => {
  const [lockContinue, setLockContinue] = useState(false)

  const { usedInvitationsCount, subscriptionInvitations } = subscriptionState

  const activeSubscriptions = subscriptionInvitations?.filter((invitation) =>
    [InvitationStatus.Sent, InvitationStatus.Accepted].includes(invitation.status),
  )
  const inActiveSubscriptions = subscriptionInvitations?.filter((invitation) =>
    [InvitationStatus.Declined, InvitationStatus.Canceled].includes(invitation.status),
  )

  const handleCancel = async (invitationUuid: Uuid) => {
    if (lockContinue) {
      application.alertService.alert('Cancelation already in progress.').catch(console.error)

      return
    }

    setLockContinue(true)

    const success = await subscriptionState.cancelSubscriptionInvitation(invitationUuid)

    setLockContinue(false)

    if (!success) {
      application.alertService
        .alert('Could not cancel invitation. Please try again or contact support if the issue persists.')
        .catch(console.error)
    }
  }

  if (usedInvitationsCount === 0) {
    return <Text className="mt-1 mb-3">Make your first subscription invitation below.</Text>
  }

  return (
    <div>
      <SubtitleLight className="mb-2 text-info">Active Invitations:</SubtitleLight>
      {activeSubscriptions?.map((invitation) => (
        <div key={invitation.uuid} className="mt-1 mb-4">
          <Text>
            {invitation.inviteeIdentifier} <span className="text-info">({invitation.status})</span>
          </Text>
          {invitation.status !== InvitationStatus.Canceled && (
            <Button className="mt-2 min-w-20" label="Cancel" onClick={() => handleCancel(invitation.uuid)} />
          )}
        </div>
      ))}
      {!!inActiveSubscriptions?.length && (
        <>
          <SubtitleLight className="mb-2 text-info">Inactive Invitations:</SubtitleLight>
          <div>
            {inActiveSubscriptions?.map((invitation) => (
              <div key={invitation.uuid} className="mb-3 first:mt-2">
                <Text className="mt-1">
                  {invitation.inviteeIdentifier} <span className="text-info">({invitation.status})</span>
                </Text>
              </div>
            ))}
          </div>
        </>
      )}
      {!subscriptionState.allInvitationsUsed && <HorizontalSeparator classes="my-4" />}
    </div>
  )
}

export default observer(InvitationsList)

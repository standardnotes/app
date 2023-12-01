import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { ButtonType, InvitationStatus } from '@standardnotes/snjs'

import { SubtitleLight, Text } from '@/Components/Preferences/PreferencesComponents/Content'
import { SubscriptionController } from '@/Controllers/Subscription/SubscriptionController'
import Button from '@/Components/Button/Button'
import { WebApplication } from '@/Application/WebApplication'
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

  const handleCancel = async (invitationUuid: string) => {
    if (lockContinue) {
      application.alerts.alert('Cancelation already in progress.').catch(console.error)

      return
    }

    const confirmed = await application.alerts.confirm(
      'All uploaded files of this user will be removed. This action cannot be undone.',
      'Are you sure you want to cancel this invitation?',
      'Cancel Invitation',
      ButtonType.Danger,
    )
    if (!confirmed) {
      return
    }

    setLockContinue(true)

    const success = await subscriptionState.cancelSubscriptionInvitation(invitationUuid)

    setLockContinue(false)

    if (!success) {
      application.alerts
        .alert('Could not cancel invitation. Please try again or contact support if the issue persists.')
        .catch(console.error)
    }
  }

  if (usedInvitationsCount === 0) {
    return <Text className="mb-3 mt-1">Make your first subscription invite below.</Text>
  }

  return (
    <div>
      <SubtitleLight className="mb-2 text-info">Active Invites</SubtitleLight>
      {activeSubscriptions?.map((invitation) => (
        <div key={invitation.uuid} className="mb-4 mt-1">
          <Text>
            {invitation.inviteeIdentifier} <span className="text-info">({invitation.status})</span>
          </Text>
          {invitation.status !== InvitationStatus.Canceled && (
            <Button className="mt-2 min-w-20" label="Cancel" onClick={() => handleCancel(invitation.uuid)} />
          )}
        </div>
      ))}
      {!subscriptionState.allInvitationsUsed && <HorizontalSeparator classes="my-4" />}
    </div>
  )
}

export default observer(InvitationsList)

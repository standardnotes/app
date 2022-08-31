import { Uuid } from '@standardnotes/common'

export type SubscriptionInviteResponseBody =
  | {
      success: true
      sharedSubscriptionInvitationUuid: Uuid
    }
  | {
      success: false
    }

export type SubscriptionInviteResponseBody =
  | {
      success: true
      sharedSubscriptionInvitationUuid: string
    }
  | {
      success: false
    }

import { Uuid } from '@standardnotes/common'

export type ItemInviteResponseBody =
  | {
      success: true
      sharedItemInvitationUuid: Uuid
    }
  | {
      success: false
    }

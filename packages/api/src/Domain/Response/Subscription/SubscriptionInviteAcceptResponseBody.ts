import { Either } from '@standardnotes/common'

export type SubscriptionInviteAcceptResponseBody = Either<{ success: true }, { success: false; message: string }>

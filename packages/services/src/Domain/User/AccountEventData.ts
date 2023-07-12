import { Either } from '@standardnotes/common'
import { SignedInOrRegisteredEventPayload } from './SignedInOrRegisteredEventPayload'
import { SignedOutEventPayload } from './SignedOutEventPayload'

export interface AccountEventData {
  payload: Either<SignedInOrRegisteredEventPayload, SignedOutEventPayload>
}

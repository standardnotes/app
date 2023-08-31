import { Either } from '@standardnotes/common'
import { UserRolesChangedEventPayload, NotificationAddedForUserEventPayload } from '@standardnotes/domain-events'

export interface WebSocketsEventData {
  type: string
  payload: Either<UserRolesChangedEventPayload, NotificationAddedForUserEventPayload>
}

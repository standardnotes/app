import { NotificationPayload } from '@standardnotes/domain-core'

export enum UserEventServiceEvent {
  UserEventReceived = 'UserEventReceived',
}

export type UserEventServiceEventPayload = {
  eventPayload: NotificationPayload
}

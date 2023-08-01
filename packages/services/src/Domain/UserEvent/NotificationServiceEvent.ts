import { NotificationPayload } from '@standardnotes/domain-core'

export enum NotificationServiceEvent {
  NotificationReceived = 'NotificationReceived',
}

export type NotificationServiceEventPayload = {
  eventPayload: NotificationPayload
}

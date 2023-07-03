import { UserEventPayload } from '@standardnotes/responses'

export enum UserEventServiceEvent {
  UserEventReceived = 'UserEventReceived',
}

export type UserEventServiceEventPayload = {
  eventPayload: UserEventPayload
}

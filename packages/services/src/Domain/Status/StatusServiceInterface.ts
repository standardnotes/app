import { AbstractService } from '../Service/AbstractService'

/* istanbul ignore file */

export enum StatusServiceEvent {
  MessageChanged = 'MessageChanged',
}

export type StatusMessageIdentifier = string

export interface StatusServiceInterface extends AbstractService<StatusServiceEvent, string> {
  get message(): string
  setMessage(message: string | undefined): void
  addMessage(message: string): StatusMessageIdentifier
  removeMessage(message: StatusMessageIdentifier): void
}

import { PreferencePaneId } from '../Preferences/PreferenceId'
import { AbstractService } from '../Service/AbstractService'

/* istanbul ignore file */

export enum StatusServiceEvent {
  MessageChanged = 'MessageChanged',
  PreferencesBubbleCountChanged = 'PreferencesBubbleCountChanged',
}

export type StatusMessageIdentifier = string

export interface StatusServiceInterface extends AbstractService<StatusServiceEvent, string> {
  getPreferencesBubbleCount(preferencePaneId: PreferencePaneId): number
  setPreferencesBubbleCount(preferencePaneId: PreferencePaneId, count: number): void
  get totalPreferencesBubbleCount(): number

  get message(): string
  setMessage(message: string | undefined): void
  addMessage(message: string): StatusMessageIdentifier
  removeMessage(message: StatusMessageIdentifier): void
}

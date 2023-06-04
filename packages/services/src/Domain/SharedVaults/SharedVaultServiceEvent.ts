import { KeySystemIdentifier } from '@standardnotes/models'

export enum SharedVaultServiceEvent {
  SharedVaultStatusChanged = 'SharedVaultStatusChanged',
}

export type SharedVaultServiceEventPayload = {
  sharedVaultUuid: string
  keySystemIdentifier: KeySystemIdentifier
}

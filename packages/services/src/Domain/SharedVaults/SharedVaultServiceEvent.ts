import { KeySystemIdentifier } from '@standardnotes/models'

export enum SharedVaultServiceEvent {
  SharedVaultStatusChanged = 'SharedVaultStatusChanged',
  SharedVaultMemberRemoved = 'SharedVaultMemberRemoved',
}

export type SharedVaultServiceEventPayload = {
  sharedVaultUuid: string
  keySystemIdentifier: KeySystemIdentifier
}

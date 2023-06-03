export enum SharedVaultServiceEvent {
  SharedVaultStatusChanged = 'SharedVaultStatusChanged',
  SharedVaultMemberRemoved = 'SharedVaultMemberRemoved',
}

export type SharedVaultServiceEventPayload = {
  sharedVaultUuid: string
  keySystemIdentifier: string
}

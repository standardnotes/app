export enum VaultCollaborationServiceEvent {
  VaultCollaborationStatusChanged = 'VaultCollaborationStatusChanged',
  VaultMemberRemoved = 'VaultMemberRemoved',
}

export type VaultCollaborationServiceEventPayload = {
  vaultUuid: string
}

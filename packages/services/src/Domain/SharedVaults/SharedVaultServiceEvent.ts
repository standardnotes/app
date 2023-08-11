import { KeySystemIdentifier } from '@standardnotes/models'

export enum SharedVaultServiceEvent {
  SharedVaultStatusChanged = 'SharedVaultStatusChanged',
  SharedVaultFileStorageUsageChanged = 'SharedVaultFileStorageUsageChanged',
}

export type SharedVaultServiceEventPayload = {
  sharedVaultUuid: string
  keySystemIdentifier: KeySystemIdentifier
}

import { VaultListingInterface } from '@standardnotes/models'

export enum VaultServiceEvent {
  VaultRootKeyRotated = 'VaultRootKeyRotated',
}

export type VaultServiceEventPayload = {
  [VaultServiceEvent.VaultRootKeyRotated]: {
    vault: VaultListingInterface
  }
}

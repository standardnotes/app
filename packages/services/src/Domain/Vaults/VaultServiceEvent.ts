import { VaultListingInterface } from '@standardnotes/models'

export enum VaultServiceEvent {
  VaultRootKeyRotated = 'VaultRootKeyRotated',
  VaultUnlocked = 'VaultUnlocked',
}

export type VaultServiceEventPayload = {
  [VaultServiceEvent.VaultRootKeyRotated]: {
    vault: VaultListingInterface
  }
  [VaultServiceEvent.VaultUnlocked]: {
    vault: VaultListingInterface
  }
}

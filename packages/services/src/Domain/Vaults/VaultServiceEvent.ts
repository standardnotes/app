import { VaultListingInterface } from '@standardnotes/models'

export enum VaultServiceEvent {
  VaultRootKeyRotated = 'VaultRootKeyRotated',
  VaultUnlocked = 'VaultUnlocked',
  VaultLocked = 'VaultLocked',
}

export type VaultServiceEventPayload = {
  [VaultServiceEvent.VaultRootKeyRotated]: {
    vault: VaultListingInterface
  }
  [VaultServiceEvent.VaultUnlocked]: {
    vault: VaultListingInterface
  }
  [VaultServiceEvent.VaultLocked]: {
    vault: VaultListingInterface
  }
}

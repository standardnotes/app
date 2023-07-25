import { VaultListingInterface } from '@standardnotes/models'

export enum VaultLockServiceEvent {
  VaultUnlocked = 'VaultUnlocked',
  VaultLocked = 'VaultLocked',
}

export type VaultLockServiceEventPayload = {
  [VaultLockServiceEvent.VaultUnlocked]: {
    vault: VaultListingInterface
  }
  [VaultLockServiceEvent.VaultLocked]: {
    vault: VaultListingInterface
  }
}

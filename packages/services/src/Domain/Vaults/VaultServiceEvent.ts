import { VaultDisplayListing } from '@standardnotes/models'

export enum VaultServiceEvent {
  VaultsChanged = 'VaultsChanged',
  VaultRootKeyChanged = 'VaultRootKeyChanged',
}

export type VaultServiceEventPayload = {
  [VaultServiceEvent.VaultsChanged]: undefined
  [VaultServiceEvent.VaultRootKeyChanged]: {
    vault: VaultDisplayListing
  }
}

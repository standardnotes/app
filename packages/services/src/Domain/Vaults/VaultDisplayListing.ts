import { KeySystemIdentifier } from '@standardnotes/models'

type CommonVaultDisplayListing = {
  systemIdentifier: KeySystemIdentifier
  decrypted?: {
    name: string
    description?: string
  }
  encrypted?: {
    label: string
  }
}

export type SharedVaultDisplayListing = CommonVaultDisplayListing & {
  sharedVaultUuid: string
  ownerUserUuid: string
}

export function isSharedVaultDisplayListing(vault: VaultDisplayListing): vault is SharedVaultDisplayListing {
  return 'sharedVaultUuid' in vault
}

export type VaultDisplayListing = CommonVaultDisplayListing | SharedVaultDisplayListing

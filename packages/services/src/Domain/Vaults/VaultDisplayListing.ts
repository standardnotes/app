import { KeySystemIdentifier } from '@standardnotes/models'

export type VaultDisplayListing = {
  systemIdentifier: KeySystemIdentifier
  sharedVaultUuid?: string
  ownerUserUuid?: string
  decrypted?: {
    name: string
    description?: string
  }
  encrypted?: {
    label: string
  }
}

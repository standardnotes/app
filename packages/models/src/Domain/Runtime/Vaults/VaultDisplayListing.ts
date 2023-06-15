import {
  KeySystemRootKeyParamsInterface,
  KeySystemRootKeyPasswordType,
} from '../../Local/KeyParams/KeySystemRootKeyParamsInterface'
import { KeySystemIdentifier } from '../../Syncable/KeySystemRootKey/KeySystemIdentifier'

type CommonVaultDisplayListing = {
  systemIdentifier: KeySystemIdentifier
  passwordType: KeySystemRootKeyPasswordType
  keyParams: KeySystemRootKeyParamsInterface
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
  return 'sharedVaultUuid' in vault && vault.sharedVaultUuid != undefined
}

export type VaultDisplayListing = CommonVaultDisplayListing | SharedVaultDisplayListing

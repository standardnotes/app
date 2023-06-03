import { ProtocolVersion } from '@standardnotes/common'
import { DecryptedItemInterface } from '../../Abstract/Item/Interfaces/DecryptedItem'
import { VaultKeyCopyContent } from './VaultKeyCopyContent'
import { KeySystemIdentifier } from '../../Utilities/Vault/KeySystemIdentifier'

export interface VaultKeyCopyInterface extends DecryptedItemInterface<VaultKeyCopyContent> {
  keySystemIdentifier: KeySystemIdentifier

  vaultName: string
  vaultDescription?: string

  key: string
  keyTimestamp: number
  keyVersion: ProtocolVersion

  get itemsKey(): string

  /**
   * Vault key copies pertain to a vault system, but they are not actually encrypted inside a vault system, but rather
   * saved as a normal item in the user's account. An item's vauly_system_identifier tells the cryptographic system which
   * keys to use to encrypt, but a vaultCopy's keySystemIdentifier is just a reference to that identifier that doesn't
   * bind the item to a specific vault system's cryptographic keys.
   */
  get key_system_identifier(): undefined
}

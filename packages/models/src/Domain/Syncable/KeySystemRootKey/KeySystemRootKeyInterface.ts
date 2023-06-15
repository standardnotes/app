import { ProtocolVersion } from '@standardnotes/common'
import { DecryptedItemInterface } from '../../Abstract/Item/Interfaces/DecryptedItem'
import { KeySystemRootKeyContent } from './KeySystemRootKeyContent'
import { KeySystemIdentifier } from './KeySystemIdentifier'
import { KeySystemRootKeyParamsInterface } from '../../Local/KeyParams/KeySystemRootKeyParamsInterface'

export interface KeySystemRootKeyInterface extends DecryptedItemInterface<KeySystemRootKeyContent> {
  keyParams: KeySystemRootKeyParamsInterface

  systemIdentifier: KeySystemIdentifier
  systemName: string
  systemDescription?: string

  key: string
  keyVersion: ProtocolVersion

  /**
   * An items key anchor is passed to all items keys created while this root key was active.
   * When determining which items key a client should use to encrypt new items or new changes,
   * it should look for items keys which have the current root key itemsKeyAnchor. This prevents
   * the server from dictating which items key a client should use, and also prevents a server from withholding
   * items keys from sync results, which would otherwise compel a client to choose between its available items keys,
   * which may be old or rotated.
   */
  itemsKeyAnchor: string

  get itemsKey(): string

  /**
   * Vault key copies pertain to a vault system, but they are not actually encrypted inside a vault system, but rather
   * saved as a normal item in the user's account. An item's vauly_system_identifier tells the cryptographic system which
   * keys to use to encrypt, but a vaultCopy's keySystemIdentifier is just a reference to that identifier that doesn't
   * bind the item to a specific vault system's cryptographic keys.
   */
  get key_system_identifier(): undefined
}

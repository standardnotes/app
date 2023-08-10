import { DecryptedItemInterface } from '../../Abstract/Item/Interfaces/DecryptedItem'
import { KeySystemRootKeyContent } from './KeySystemRootKeyContent'
import { KeySystemIdentifier } from './KeySystemIdentifier'
import { KeySystemRootKeyParamsInterface } from '../../Local/KeyParams/KeySystemRootKeyParamsInterface'
import { ProtocolVersion } from '../../Local/Protocol/ProtocolVersion'

export interface KeySystemRootKeyInterface extends DecryptedItemInterface<KeySystemRootKeyContent> {
  keyParams: KeySystemRootKeyParamsInterface

  systemIdentifier: KeySystemIdentifier

  key: string
  keyVersion: ProtocolVersion

  /**
   * A token is passed to all items keys created while this root key was active.
   * When determining which items key a client should use to encrypt new items or new changes,
   * it should look for items keys which have the current root key token. This prevents
   * the server from dictating which items key a client should use, and also prevents a server from withholding
   * items keys from sync results, which would otherwise compel a client to choose between its available items keys,
   * which may be old or rotated.
   *
   * This token is part of the encrypted payload of both the root key and corresponding items keys. While not
   * necessarily destructive if leaked, it prevents a malicious server from creating a compromised items key for a vault.
   */
  token: string

  get itemsKey(): string

  /**
   * Key system root keys pertain to a key system, but they are not actually encrypted inside a key system, but rather
   * saved as a normal item in the user's account. An item's key_system_identifier tells the cryptographic system which
   * keys to use to encrypt, but a key system rootkey's systemIdentifier is just a reference to that identifier that doesn't
   * bind the item to a specific vault system's cryptographic keys.
   */
  get key_system_identifier(): undefined
  get shared_vault_uuid(): undefined

  isEqual(other: KeySystemRootKeyInterface): boolean
}

import {
  DecryptedPayloadInterface,
  ItemContent,
  ItemsKeyInterface,
  KeySystemItemsKeyInterface,
  KeySystemRootKeyInterface,
  RootKeyInterface,
} from '@standardnotes/models'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'
import { EncryptedOutputParameters, ErrorDecryptingParameters } from '../../Types/EncryptedParameters'
import { DecryptedParameters } from '../../Types/DecryptedParameters'

export interface SyncOperatorInterface {
  /**
   * Converts a bare payload into an encrypted one in the desired format.
   * @param payload - The non-encrypted payload object to encrypt
   * @param key - The key to use to encrypt the payload. Can be either
   *  a RootKey (when encrypting payloads that require root key encryption, such as encrypting
   * items keys), or an ItemsKey (if encrypted regular items)
   */
  generateEncryptedParameters(
    payload: DecryptedPayloadInterface,
    key: ItemsKeyInterface | KeySystemItemsKeyInterface | KeySystemRootKeyInterface | RootKeyInterface,
    signingKeyPair?: PkcKeyPair,
  ): EncryptedOutputParameters

  generateDecryptedParameters<C extends ItemContent = ItemContent>(
    encrypted: EncryptedOutputParameters,
    key: ItemsKeyInterface | KeySystemItemsKeyInterface | KeySystemRootKeyInterface | RootKeyInterface,
  ): DecryptedParameters<C> | ErrorDecryptingParameters
}

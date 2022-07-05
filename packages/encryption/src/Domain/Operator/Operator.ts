import { KeyParamsOrigination } from '@standardnotes/common'
import * as Models from '@standardnotes/models'
import { ItemsKeyInterface, RootKeyInterface } from '@standardnotes/models'
import { SNRootKey } from '../Keys/RootKey/RootKey'
import { SNRootKeyParams } from '../Keys/RootKey/RootKeyParams'
import { DecryptedParameters, EncryptedParameters, ErrorDecryptingParameters } from '../Types/EncryptedParameters'
import { ItemAuthenticatedData } from '../Types/ItemAuthenticatedData'
import { LegacyAttachedData } from '../Types/LegacyAttachedData'
import { RootKeyEncryptedAuthenticatedData } from '../Types/RootKeyEncryptedAuthenticatedData'

/**w
 * An operator is responsible for performing crypto operations, such as generating keys
 * and encrypting/decrypting payloads. Operators interact directly with
 * platform dependent SNPureCrypto implementation to directly access cryptographic primitives.
 * Each operator is versioned according to the protocol version. Functions that are common
 * across all versions appear in this generic parent class.
 */
export interface OperatorCommon {
  createItemsKey(): ItemsKeyInterface
  /**
   * Returns encryption protocol display name
   */
  getEncryptionDisplayName(): string

  readonly version: string

  /**
   * Returns the payload's authenticated data. The passed payload must be in a
   * non-decrypted, ciphertext state.
   */
  getPayloadAuthenticatedData(
    encrypted: EncryptedParameters,
  ): RootKeyEncryptedAuthenticatedData | ItemAuthenticatedData | LegacyAttachedData | undefined

  /**
   * Computes a root key given a password and previous keyParams
   * @param password - Plain string representing raw user password
   */
  computeRootKey(password: string, keyParams: SNRootKeyParams): Promise<SNRootKey>

  /**
   * Creates a new root key given an identifier and a user password
   * @param identifier - Plain string representing a unique identifier
   *    for the user
   * @param password - Plain string representing raw user password
   */
  createRootKey(identifier: string, password: string, origination: KeyParamsOrigination): Promise<SNRootKey>
}

export interface SynchronousOperator extends OperatorCommon {
  /**
   * Converts a bare payload into an encrypted one in the desired format.
   * @param payload - The non-encrypted payload object to encrypt
   * @param key - The key to use to encrypt the payload. Can be either
   *  a RootKey (when encrypting payloads that require root key encryption, such as encrypting
   * items keys), or an ItemsKey (if encrypted regular items)
   */
  generateEncryptedParametersSync(
    payload: Models.DecryptedPayloadInterface,
    key: ItemsKeyInterface | RootKeyInterface,
  ): EncryptedParameters

  generateDecryptedParametersSync<C extends Models.ItemContent = Models.ItemContent>(
    encrypted: EncryptedParameters,
    key: ItemsKeyInterface | RootKeyInterface,
  ): DecryptedParameters<C> | ErrorDecryptingParameters
}

export interface AsynchronousOperator extends OperatorCommon {
  /**
   * Converts a bare payload into an encrypted one in the desired format.
   * @param payload - The non-encrypted payload object to encrypt
   * @param key - The key to use to encrypt the payload. Can be either
   *  a RootKey (when encrypting payloads that require root key encryption, such as encrypting
   * items keys), or an ItemsKey (if encrypted regular items)
   */
  generateEncryptedParametersAsync(
    payload: Models.DecryptedPayloadInterface,
    key: ItemsKeyInterface | RootKeyInterface,
  ): Promise<EncryptedParameters>

  generateDecryptedParametersAsync<C extends Models.ItemContent = Models.ItemContent>(
    encrypted: EncryptedParameters,
    key: ItemsKeyInterface | RootKeyInterface,
  ): Promise<DecryptedParameters<C> | ErrorDecryptingParameters>
}

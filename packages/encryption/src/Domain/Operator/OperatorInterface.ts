import { KeyParamsOrigination, ProtocolVersion } from '@standardnotes/common'
import {
  ItemsKeyInterface,
  RootKeyInterface,
  KeySystemItemsKeyInterface,
  DecryptedPayloadInterface,
  ItemContent,
  KeySystemRootKeyInterface,
  KeySystemRootKeyContentSpecialized,
  KeySystemIdentifier,
} from '@standardnotes/models'
import { SNRootKeyParams } from '../Keys/RootKey/RootKeyParams'
import { DecryptedParameters, EncryptedParameters, ErrorDecryptingParameters } from '../Types/EncryptedParameters'
import { ItemAuthenticatedData } from '../Types/ItemAuthenticatedData'
import { LegacyAttachedData } from '../Types/LegacyAttachedData'
import { RootKeyEncryptedAuthenticatedData } from '../Types/RootKeyEncryptedAuthenticatedData'
import { HexString, PkcKeyPair } from '@standardnotes/sncrypto-common'
import { AsymmetricallyEncryptedString } from './Types'

/**w
 * An operator is responsible for performing crypto operations, such as generating keys
 * and encrypting/decrypting payloads. Operators interact directly with
 * platform dependent SNPureCrypto implementation to directly access cryptographic primitives.
 * Each operator is versioned according to the protocol version. Functions that are common
 * across all versions appear in this generic parent class.
 */
export interface OperatorInterface {
  /**
   * Returns encryption protocol display name
   */
  getEncryptionDisplayName(): string

  readonly version: string

  createItemsKey(): ItemsKeyInterface
  createKeySystemItemsKey(uuid: string, keySystemIdentifier: KeySystemIdentifier): KeySystemItemsKeyInterface

  /**
   * Returns the payload's authenticated data. The passed payload must be in a
   * non-decrypted, ciphertext state.
   */
  getPayloadAuthenticatedDataForExternalUse(
    encrypted: EncryptedParameters,
  ): RootKeyEncryptedAuthenticatedData | ItemAuthenticatedData | LegacyAttachedData | undefined

  /**
   * Computes a root key given a password and previous keyParams
   * @param password - Plain string representing raw user password
   */
  computeRootKey<K extends RootKeyInterface>(password: string, keyParams: SNRootKeyParams): Promise<K>

  /**
   * Creates a new root key given an identifier and a user password
   * @param identifier - Plain string representing a unique identifier
   *    for the user
   * @param password - Plain string representing raw user password
   */
  createRootKey<K extends RootKeyInterface>(
    identifier: string,
    password: string,
    origination: KeyParamsOrigination,
  ): Promise<K>

  createKeySystemRootKeyContent(params: {
    systemIdentifier: KeySystemIdentifier
    systemName: string
  }): KeySystemRootKeyContentSpecialized

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
  ): EncryptedParameters

  generateDecryptedParameters<C extends ItemContent = ItemContent>(
    encrypted: EncryptedParameters,
    key: ItemsKeyInterface | KeySystemItemsKeyInterface | KeySystemRootKeyInterface | RootKeyInterface,
  ): DecryptedParameters<C> | ErrorDecryptingParameters

  asymmetricEncrypt(dto: {
    stringToEncrypt: HexString
    senderSecretKey: HexString
    senderSigningKeyPair: PkcKeyPair
    recipientPublicKey: HexString
  }): AsymmetricallyEncryptedString
  asymmetricDecrypt(dto: {
    stringToDecrypt: AsymmetricallyEncryptedString
    senderPublicKey: HexString
    recipientSecretKey: HexString
  }): { plaintext: HexString; signatureVerified: boolean; signaturePublicKey: string } | null
  getSignerPublicKeyFromAsymmetricallyEncryptedString(string: AsymmetricallyEncryptedString): HexString

  versionForAsymmetricallyEncryptedString(encryptedString: string): ProtocolVersion
}

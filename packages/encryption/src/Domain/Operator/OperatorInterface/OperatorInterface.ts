import { KeyParamsOrigination, ProtocolVersion } from '@standardnotes/common'
import {
  ItemsKeyInterface,
  RootKeyInterface,
  KeySystemItemsKeyInterface,
  KeySystemRootKeyInterface,
  KeySystemIdentifier,
  KeySystemRootKeyParamsInterface,
  PortablePublicKeySet,
} from '@standardnotes/models'
import { SNRootKeyParams } from '../../Keys/RootKey/RootKeyParams'
import { EncryptedOutputParameters } from '../../Types/EncryptedParameters'
import { ItemAuthenticatedData } from '../../Types/ItemAuthenticatedData'
import { LegacyAttachedData } from '../../Types/LegacyAttachedData'
import { RootKeyEncryptedAuthenticatedData } from '../../Types/RootKeyEncryptedAuthenticatedData'
import { HexString, PkcKeyPair } from '@standardnotes/sncrypto-common'
import { AsymmetricallyEncryptedString } from '../Types/Types'
import { AsymmetricDecryptResult } from '../Types/AsymmetricDecryptResult'
import { AsymmetricSignatureVerificationDetachedResult } from '../Types/AsymmetricSignatureVerificationDetachedResult'
import { AsymmetricItemAdditionalData } from '../../Types/EncryptionAdditionalData'
import { Result } from '@standardnotes/domain-core'

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

  /**
   * Returns the payload's authenticated data. The passed payload must be in a
   * non-decrypted, ciphertext state.
   */
  getPayloadAuthenticatedDataForExternalUse(
    encrypted: EncryptedOutputParameters,
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

  createRandomizedKeySystemRootKey(dto: { systemIdentifier: KeySystemIdentifier }): KeySystemRootKeyInterface

  createUserInputtedKeySystemRootKey(dto: {
    systemIdentifier: KeySystemIdentifier
    userInputtedPassword: string
  }): KeySystemRootKeyInterface

  deriveUserInputtedKeySystemRootKey(dto: {
    keyParams: KeySystemRootKeyParamsInterface
    userInputtedPassword: string
  }): KeySystemRootKeyInterface

  createKeySystemItemsKey(
    uuid: string,
    keySystemIdentifier: KeySystemIdentifier,
    sharedVaultUuid: string | undefined,
    rootKeyToken: string,
  ): KeySystemItemsKeyInterface

  asymmetricEncrypt(dto: {
    stringToEncrypt: HexString
    senderKeyPair: PkcKeyPair
    senderSigningKeyPair: PkcKeyPair
    recipientPublicKey: HexString
  }): AsymmetricallyEncryptedString

  asymmetricDecrypt(dto: {
    stringToDecrypt: AsymmetricallyEncryptedString
    recipientSecretKey: HexString
  }): AsymmetricDecryptResult | null

  asymmetricDecryptOwnMessage(dto: {
    message: AsymmetricallyEncryptedString
    ownPrivateKey: HexString
    recipientPublicKey: HexString
  }): Result<AsymmetricDecryptResult>

  asymmetricSignatureVerifyDetached(
    encryptedString: AsymmetricallyEncryptedString,
  ): AsymmetricSignatureVerificationDetachedResult

  asymmetricStringGetAdditionalData(dto: {
    encryptedString: AsymmetricallyEncryptedString
  }): Result<AsymmetricItemAdditionalData>

  getSenderPublicKeySetFromAsymmetricallyEncryptedString(string: AsymmetricallyEncryptedString): PortablePublicKeySet

  versionForAsymmetricallyEncryptedString(encryptedString: string): ProtocolVersion
}

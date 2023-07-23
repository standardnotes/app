import { KeyParamsOrigination, ProtocolVersion, ProtocolVersionLength } from '@standardnotes/common'
import {
  CreateDecryptedItemFromPayload,
  DecryptedPayload,
  DecryptedPayloadInterface,
  FillItemContent,
  ItemContent,
  ItemsKeyContent,
  ItemsKeyInterface,
  PayloadTimestampDefaults,
  KeySystemItemsKeyInterface,
  KeySystemIdentifier,
  KeySystemRootKeyInterface,
  RootKeyInterface,
  KeySystemRootKeyParamsInterface,
  PortablePublicKeySet,
} from '@standardnotes/models'
import { PkcKeyPair, PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { firstHalfOfString, secondHalfOfString, splitString, UuidGenerator } from '@standardnotes/utils'
import { V001Algorithm } from '../../Algorithm'
import { isItemsKey } from '../../Keys/ItemsKey/ItemsKey'
import { CreateNewRootKey } from '../../Keys/RootKey/Functions'
import { Create001KeyParams } from '../../Keys/RootKey/KeyParamsFunctions'
import { SNRootKey } from '../../Keys/RootKey/RootKey'
import { SNRootKeyParams } from '../../Keys/RootKey/RootKeyParams'
import { EncryptedOutputParameters, ErrorDecryptingParameters } from '../../Types/EncryptedParameters'
import { DecryptedParameters } from '../../Types/DecryptedParameters'
import { ItemAuthenticatedData } from '../../Types/ItemAuthenticatedData'
import { LegacyAttachedData } from '../../Types/LegacyAttachedData'
import { RootKeyEncryptedAuthenticatedData } from '../../Types/RootKeyEncryptedAuthenticatedData'
import { OperatorInterface } from '../OperatorInterface/OperatorInterface'

import { AsymmetricDecryptResult } from '../Types/AsymmetricDecryptResult'
import { AsymmetricSignatureVerificationDetachedResult } from '../Types/AsymmetricSignatureVerificationDetachedResult'
import { AsyncOperatorInterface } from '../OperatorInterface/AsyncOperatorInterface'
import { ContentType, Result } from '@standardnotes/domain-core'
import { AsymmetricItemAdditionalData } from '../../Types/EncryptionAdditionalData'

const NO_IV = '00000000000000000000000000000000'

/**
 * @deprecated
 * A legacy operator no longer used to generate new accounts
 */
export class SNProtocolOperator001 implements OperatorInterface, AsyncOperatorInterface {
  protected readonly crypto: PureCryptoInterface

  constructor(crypto: PureCryptoInterface) {
    this.crypto = crypto
  }

  public getEncryptionDisplayName(): string {
    return 'AES-256'
  }

  get version(): ProtocolVersion {
    return ProtocolVersion.V001
  }

  protected generateNewItemsKeyContent(): ItemsKeyContent {
    const keyLength = V001Algorithm.EncryptionKeyLength
    const itemsKey = this.crypto.generateRandomKey(keyLength)
    const response = FillItemContent<ItemsKeyContent>({
      itemsKey: itemsKey,
      version: ProtocolVersion.V001,
    })
    return response
  }

  /**
   * Creates a new random items key to use for item encryption.
   * The consumer must save/sync this item.
   */
  public createItemsKey(): ItemsKeyInterface {
    const payload = new DecryptedPayload({
      uuid: UuidGenerator.GenerateUuid(),
      content_type: ContentType.TYPES.ItemsKey,
      content: this.generateNewItemsKeyContent(),
      ...PayloadTimestampDefaults(),
    })
    return CreateDecryptedItemFromPayload(payload)
  }

  public async createRootKey<K extends RootKeyInterface>(
    identifier: string,
    password: string,
    origination: KeyParamsOrigination,
  ): Promise<K> {
    const pwCost = V001Algorithm.PbkdfMinCost as number
    const pwNonce = this.crypto.generateRandomKey(V001Algorithm.SaltSeedLength)
    const pwSalt = await this.crypto.unsafeSha1(identifier + 'SN' + pwNonce)

    const keyParams = Create001KeyParams({
      email: identifier,
      pw_cost: pwCost,
      pw_nonce: pwNonce,
      pw_salt: pwSalt,
      version: ProtocolVersion.V001,
      origination,
      created: `${Date.now()}`,
    })

    return this.deriveKey(password, keyParams)
  }

  public getPayloadAuthenticatedDataForExternalUse(
    _encrypted: EncryptedOutputParameters,
  ): RootKeyEncryptedAuthenticatedData | ItemAuthenticatedData | LegacyAttachedData | undefined {
    return undefined
  }

  public async computeRootKey<K extends RootKeyInterface>(password: string, keyParams: SNRootKeyParams): Promise<K> {
    return this.deriveKey(password, keyParams)
  }

  private async decryptString(ciphertext: string, key: string) {
    return this.crypto.aes256CbcDecrypt(ciphertext, NO_IV, key)
  }

  private async encryptString(text: string, key: string) {
    return this.crypto.aes256CbcEncrypt(text, NO_IV, key)
  }

  public async generateEncryptedParametersAsync(
    payload: DecryptedPayloadInterface,
    key: ItemsKeyInterface | SNRootKey,
  ): Promise<EncryptedOutputParameters> {
    /**
     * Generate new item key that is double the key size.
     * Will be split to create encryption key and authentication key.
     */
    const itemKey = this.crypto.generateRandomKey(V001Algorithm.EncryptionKeyLength * 2)
    const encItemKey = await this.encryptString(itemKey, key.itemsKey)

    /** Encrypt content */
    const ek = firstHalfOfString(itemKey)
    const ak = secondHalfOfString(itemKey)
    const contentCiphertext = await this.encryptString(JSON.stringify(payload.content), ek)
    const ciphertext = key.keyVersion + contentCiphertext
    const authHash = await this.crypto.hmac256(ciphertext, ak)

    if (!authHash) {
      throw Error('Error generating hmac256 authHash')
    }

    return {
      uuid: payload.uuid,
      content_type: payload.content_type,
      items_key_id: isItemsKey(key) ? key.uuid : undefined,
      content: ciphertext,
      enc_item_key: encItemKey,
      auth_hash: authHash,
      version: this.version,
      key_system_identifier: payload.key_system_identifier,
      shared_vault_uuid: payload.shared_vault_uuid,
    }
  }

  public async generateDecryptedParametersAsync<C extends ItemContent = ItemContent>(
    encrypted: EncryptedOutputParameters,
    key: ItemsKeyInterface | SNRootKey,
  ): Promise<DecryptedParameters<C> | ErrorDecryptingParameters> {
    if (!encrypted.enc_item_key) {
      console.error(Error('Missing item encryption key, skipping decryption.'))
      return {
        uuid: encrypted.uuid,
        errorDecrypting: true,
      }
    }

    let encryptedItemKey = encrypted.enc_item_key
    encryptedItemKey = this.version + encryptedItemKey
    const itemKeyComponents = this.encryptionComponentsFromString(encryptedItemKey, key.itemsKey)

    const itemKey = await this.decryptString(itemKeyComponents.ciphertext, itemKeyComponents.key)
    if (!itemKey) {
      console.error('Error decrypting parameters', encrypted)
      return {
        uuid: encrypted.uuid,
        errorDecrypting: true,
      }
    }

    const ek = firstHalfOfString(itemKey)
    const itemParams = this.encryptionComponentsFromString(encrypted.content, ek)
    const content = await this.decryptString(itemParams.ciphertext, itemParams.key)

    if (!content) {
      return {
        uuid: encrypted.uuid,
        errorDecrypting: true,
      }
    } else {
      return {
        uuid: encrypted.uuid,
        content: JSON.parse(content),
        signatureData: { required: false, contentHash: '' },
      }
    }
  }

  private encryptionComponentsFromString(string: string, encryptionKey: string) {
    const encryptionVersion = string.substring(0, ProtocolVersionLength)
    return {
      ciphertext: string.substring(ProtocolVersionLength, string.length),
      version: encryptionVersion,
      key: encryptionKey,
    }
  }

  protected async deriveKey<K extends RootKeyInterface>(password: string, keyParams: SNRootKeyParams): Promise<K> {
    const derivedKey = await this.crypto.pbkdf2(
      password,
      keyParams.content001.pw_salt,
      keyParams.content001.pw_cost,
      V001Algorithm.PbkdfOutputLength,
    )

    if (!derivedKey) {
      throw Error('Error deriving PBKDF2 key')
    }

    const partitions = splitString(derivedKey, 2)

    return CreateNewRootKey<K>({
      serverPassword: partitions[0],
      masterKey: partitions[1],
      version: ProtocolVersion.V001,
      keyParams: keyParams.getPortableValue(),
    })
  }

  createRandomizedKeySystemRootKey(_dto: { systemIdentifier: string }): KeySystemRootKeyInterface {
    throw new Error('Method not implemented.')
  }

  createUserInputtedKeySystemRootKey(_dto: {
    systemIdentifier: string
    systemName: string
    userInputtedPassword: string
  }): KeySystemRootKeyInterface {
    throw new Error('Method not implemented.')
  }

  deriveUserInputtedKeySystemRootKey(_dto: {
    keyParams: KeySystemRootKeyParamsInterface
    userInputtedPassword: string
  }): KeySystemRootKeyInterface {
    throw new Error('Method not implemented.')
  }

  createKeySystemItemsKey(
    _uuid: string,
    _keySystemIdentifier: KeySystemIdentifier,
    _sharedVaultUuid: string | undefined,
  ): KeySystemItemsKeyInterface {
    throw new Error('Method not implemented.')
  }

  versionForAsymmetricallyEncryptedString(_encryptedString: string): ProtocolVersion {
    throw new Error('Method not implemented.')
  }

  asymmetricEncrypt(_dto: {
    stringToEncrypt: string
    senderKeyPair: PkcKeyPair
    senderSigningKeyPair: PkcKeyPair
    recipientPublicKey: string
  }): string {
    throw new Error('Method not implemented.')
  }

  asymmetricDecrypt(_dto: { stringToDecrypt: string; recipientSecretKey: string }): AsymmetricDecryptResult | null {
    throw new Error('Method not implemented.')
  }

  asymmetricDecryptOwnMessage(_dto: {
    message: string
    ownPrivateKey: string
    recipientPublicKey: string
  }): Result<AsymmetricDecryptResult> {
    throw new Error('Method not implemented.')
  }

  asymmetricSignatureVerifyDetached(_encryptedString: string): AsymmetricSignatureVerificationDetachedResult {
    throw new Error('Method not implemented.')
  }

  asymmetricStringGetAdditionalData(_dto: { encryptedString: string }): Result<AsymmetricItemAdditionalData> {
    throw new Error('Method not implemented.')
  }

  getSenderPublicKeySetFromAsymmetricallyEncryptedString(_string: string): PortablePublicKeySet {
    throw new Error('Method not implemented.')
  }
}

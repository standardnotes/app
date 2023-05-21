import { ContentType, KeyParamsOrigination, ProtocolVersion } from '@standardnotes/common'
import {
  CreateDecryptedItemFromPayload,
  FillItemContent,
  ItemContent,
  ItemsKeyContent,
  ItemsKeyInterface,
  PayloadTimestampDefaults,
  DecryptedPayload,
  DecryptedPayloadInterface,
  SharedItemsKeyInterface,
  SharedItemsKeyContent,
  DecryptedTransferPayload,
  GroupKeyInterface,
  isGroupKey,
} from '@standardnotes/models'
import { HexString, PkcKeyPair, PureCryptoInterface, Utf8String } from '@standardnotes/sncrypto-common'
import * as Utils from '@standardnotes/utils'
import { V004Algorithm } from '../../Algorithm'
import { isItemsKey } from '../../Keys/ItemsKey/ItemsKey'
import {
  ContentTypeUsesRootKeyEncryption,
  CreateNewRootKey,
  ItemContentTypeUsesGroupKeyEncryption,
} from '../../Keys/RootKey/Functions'
import { Create004KeyParams } from '../../Keys/RootKey/KeyParamsFunctions'
import { SNRootKey } from '../../Keys/RootKey/RootKey'
import { SNRootKeyParams } from '../../Keys/RootKey/RootKeyParams'
import { DecryptedParameters, EncryptedParameters, ErrorDecryptingParameters } from '../../Types/EncryptedParameters'
import { ItemAuthenticatedData } from '../../Types/ItemAuthenticatedData'
import { LegacyAttachedData } from '../../Types/LegacyAttachedData'
import { RootKeyEncryptedAuthenticatedData } from '../../Types/RootKeyEncryptedAuthenticatedData'
import { SynchronousOperator } from '../OperatorInterface'
import { isSharedItemsKey } from '../../Keys/SharedItemsKey/SharedItemsKey'
import { AsymmetricallyEncryptedKey, SymmetricallyEncryptedPrivateKey } from '../Types'

type V004StringComponents = [version: string, nonce: string, ciphertext: string, authenticatedData: string]

type V004Components = {
  version: V004StringComponents[0]
  nonce: V004StringComponents[1]
  ciphertext: V004StringComponents[2]
  authenticatedData: V004StringComponents[3]
}

const SymmetricCiphertextPrefix = `${ProtocolVersion.V004}_KeySym`
const AsymmetricCiphertextPrefix = `${ProtocolVersion.V004}_KeyAsym`
const AsymmetricAnonymousCiphertextPrefix = `${ProtocolVersion.V004}_KeyAsymAnon`

const PARTITION_CHARACTER = ':'

export class SNProtocolOperator004 implements SynchronousOperator {
  protected readonly crypto: PureCryptoInterface

  constructor(crypto: PureCryptoInterface) {
    this.crypto = crypto
  }

  public getEncryptionDisplayName(): string {
    return 'XChaCha20-Poly1305'
  }

  get version(): ProtocolVersion {
    return ProtocolVersion.V004
  }

  private generateNewItemsKeyContent() {
    const itemsKey = this.crypto.generateRandomKey(V004Algorithm.EncryptionKeyLength)
    const response = FillItemContent<ItemsKeyContent>({
      itemsKey: itemsKey,
      version: ProtocolVersion.V004,
    })
    return response
  }

  public createGroupKeyString(): { key: string; version: ProtocolVersion } {
    return { key: this.crypto.generateRandomKey(V004Algorithm.EncryptionKeyLength), version: ProtocolVersion.V004 }
  }

  /**
   * Creates a new random items key to use for item encryption.
   * The consumer must save/sync this item.
   */
  public createItemsKey(): ItemsKeyInterface {
    const payload = new DecryptedPayload({
      uuid: Utils.UuidGenerator.GenerateUuid(),
      content_type: ContentType.ItemsKey,
      content: this.generateNewItemsKeyContent(),
      ...PayloadTimestampDefaults(),
    })
    return CreateDecryptedItemFromPayload(payload)
  }

  public createSharedItemsKey(uuid: string, groupUuid: string): SharedItemsKeyInterface {
    const key = this.crypto.generateRandomKey(V004Algorithm.EncryptionKeyLength)
    const content = FillItemContent<SharedItemsKeyContent>({
      itemsKey: key,
      version: ProtocolVersion.V004,
    })

    const transferPayload: DecryptedTransferPayload = {
      uuid: uuid,
      content_type: ContentType.SharedItemsKey,
      group_uuid: groupUuid,
      content: content,
      dirty: true,
      ...PayloadTimestampDefaults(),
    }

    const payload = new DecryptedPayload(transferPayload)
    return CreateDecryptedItemFromPayload(payload)
  }

  /**
   * We require both a client-side component and a server-side component in generating a
   * salt. This way, a comprimised server cannot benefit from sending the same seed value
   * for every user. We mix a client-controlled value that is globally unique
   * (their identifier), with a server controlled value to produce a salt for our KDF.
   * @param identifier
   * @param seed
   */
  private async generateSalt004(identifier: string, seed: string) {
    const hash = await this.crypto.sha256([identifier, seed].join(PARTITION_CHARACTER))
    return Utils.truncateHexString(hash, V004Algorithm.ArgonSaltLength)
  }

  /**
   * Computes a root key given a passworf
   * qwd and previous keyParams
   * @param password - Plain string representing raw user password
   * @param keyParams - KeyParams object
   */
  public async computeRootKey(password: string, keyParams: SNRootKeyParams): Promise<SNRootKey> {
    return this.deriveKey(password, keyParams)
  }

  /**
   * Creates a new root key given an identifier and a user password
   * @param identifier - Plain string representing a unique identifier
   * @param password - Plain string representing raw user password
   */
  public async createRootKey(
    identifier: string,
    password: string,
    origination: KeyParamsOrigination,
  ): Promise<SNRootKey> {
    const version = ProtocolVersion.V004
    const seed = this.crypto.generateRandomKey(V004Algorithm.ArgonSaltSeedLength)
    const keyParams = Create004KeyParams({
      identifier: identifier,
      pw_nonce: seed,
      version: version,
      origination: origination,
      created: `${Date.now()}`,
    })
    return this.deriveKey(password, keyParams)
  }

  /**
   * @param plaintext - The plaintext to encrypt.
   * @param rawKey - The key to use to encrypt the plaintext.
   * @param nonce - The nonce for encryption.
   * @param authenticatedData - JavaScript object (will be stringified) representing
                'Additional authenticated data': data you want to be included in authentication.
   */
  encryptString004(plaintext: string, rawKey: string, nonce: string, authenticatedData: ItemAuthenticatedData) {
    if (!nonce) {
      throw 'encryptString null nonce'
    }
    if (!rawKey) {
      throw 'encryptString null rawKey'
    }
    return this.crypto.xchacha20Encrypt(plaintext, nonce, rawKey, this.authenticatedDataToString(authenticatedData))
  }

  /**
   * @param ciphertext  The encrypted text to decrypt.
   * @param rawKey  The key to use to decrypt the ciphertext.
   * @param nonce  The nonce for decryption.
   * @param rawAuthenticatedData String representing
                'Additional authenticated data' - data you want to be included in authentication.
   */
  private decryptString004(ciphertext: string, rawKey: string, nonce: string, rawAuthenticatedData: string) {
    return this.crypto.xchacha20Decrypt(ciphertext, nonce, rawKey, rawAuthenticatedData)
  }

  generateEncryptionNonce(): string {
    return this.crypto.generateRandomKey(V004Algorithm.EncryptionNonceLength)
  }

  /**
   * @param plaintext  The plaintext text to decrypt.
   * @param rawKey  The key to use to encrypt the plaintext.
   */
  generateEncryptedProtocolString(plaintext: string, rawKey: string, authenticatedData: ItemAuthenticatedData) {
    const nonce = this.generateEncryptionNonce()

    const ciphertext = this.encryptString004(plaintext, rawKey, nonce, authenticatedData)

    const components: V004StringComponents = [
      ProtocolVersion.V004 as string,
      nonce,
      ciphertext,
      this.authenticatedDataToString(authenticatedData),
    ]

    return components.join(PARTITION_CHARACTER)
  }

  deconstructEncryptedPayloadString(payloadString: string): V004Components {
    const components = payloadString.split(PARTITION_CHARACTER) as V004StringComponents

    return {
      version: components[0],
      nonce: components[1],
      ciphertext: components[2],
      authenticatedData: components[3],
    }
  }

  public getPayloadAuthenticatedData(
    encrypted: EncryptedParameters,
  ): RootKeyEncryptedAuthenticatedData | ItemAuthenticatedData | LegacyAttachedData | undefined {
    const itemKeyComponents = this.deconstructEncryptedPayloadString(encrypted.enc_item_key)
    const authenticatedDataString = itemKeyComponents.authenticatedData
    const result = this.stringToAuthenticatedData(authenticatedDataString)

    return result
  }

  /**
   * For items that are encrypted with a root key, we append the root key's key params, so
   * that in the event the client/user loses a reference to their root key, they may still
   * decrypt data by regenerating the key based on the attached key params.
   */
  private generateAuthenticatedDataForPayload(
    payload: DecryptedPayloadInterface,
    key: ItemsKeyInterface | SharedItemsKeyInterface | GroupKeyInterface | SNRootKey,
  ): ItemAuthenticatedData | RootKeyEncryptedAuthenticatedData {
    const baseData: ItemAuthenticatedData = {
      u: payload.uuid,
      v: ProtocolVersion.V004,
    }
    if (ContentTypeUsesRootKeyEncryption(payload.content_type)) {
      return {
        ...baseData,
        kp: (key as SNRootKey).keyParams.content,
      }
    } else if (ItemContentTypeUsesGroupKeyEncryption(payload.content_type)) {
      if (!isGroupKey(key)) {
        throw Error('Attempting to use non-group key for group item.')
      }
      return baseData
    } else {
      if (!isItemsKey(key) && !isSharedItemsKey(key)) {
        throw Error('Attempting to use non-items key for regular item.')
      }
      return baseData
    }
  }

  private authenticatedDataToString(attachedData: ItemAuthenticatedData) {
    return this.crypto.base64Encode(JSON.stringify(Utils.sortedCopy(Utils.omitUndefinedCopy(attachedData))))
  }

  private stringToAuthenticatedData(
    rawAuthenticatedData: string,
    override?: Partial<ItemAuthenticatedData>,
  ): RootKeyEncryptedAuthenticatedData | ItemAuthenticatedData {
    const base = JSON.parse(this.crypto.base64Decode(rawAuthenticatedData))
    return Utils.sortedCopy({
      ...base,
      ...override,
    })
  }

  public generateEncryptedParametersSync(
    payload: DecryptedPayloadInterface,
    key: ItemsKeyInterface | SharedItemsKeyInterface | GroupKeyInterface | SNRootKey,
  ): EncryptedParameters {
    const contentKey = this.crypto.generateRandomKey(V004Algorithm.EncryptionKeyLength)
    const contentPlaintext = JSON.stringify(payload.content)
    const authenticatedData = this.generateAuthenticatedDataForPayload(payload, key)
    const encryptedContentString = this.generateEncryptedProtocolString(contentPlaintext, contentKey, authenticatedData)
    const encryptedContentKey = this.generateEncryptedProtocolString(contentKey, key.itemsKey, authenticatedData)

    return {
      uuid: payload.uuid,
      items_key_id: isItemsKey(key) || isSharedItemsKey(key) ? key.uuid : undefined,
      content: encryptedContentString,
      enc_item_key: encryptedContentKey,
      version: this.version,
    }
  }

  public generateDecryptedParametersSync<C extends ItemContent = ItemContent>(
    encrypted: EncryptedParameters,
    key: ItemsKeyInterface | SharedItemsKeyInterface | GroupKeyInterface | SNRootKey,
  ): DecryptedParameters<C> | ErrorDecryptingParameters {
    const contentKeyComponents = this.deconstructEncryptedPayloadString(encrypted.enc_item_key)
    const authenticatedData = this.stringToAuthenticatedData(contentKeyComponents.authenticatedData, {
      u: encrypted.uuid,
      v: encrypted.version,
    })

    const useAuthenticatedString = this.authenticatedDataToString(authenticatedData)
    const contentKey = this.decryptString004(
      contentKeyComponents.ciphertext,
      key.itemsKey,
      contentKeyComponents.nonce,
      useAuthenticatedString,
    )

    if (!contentKey) {
      console.error('Error decrypting contentKey from parameters', encrypted)
      return {
        uuid: encrypted.uuid,
        errorDecrypting: true,
      }
    }

    const contentComponents = this.deconstructEncryptedPayloadString(encrypted.content)
    const content = this.decryptString004(
      contentComponents.ciphertext,
      contentKey,
      contentComponents.nonce,
      useAuthenticatedString,
    )

    if (!content) {
      return {
        uuid: encrypted.uuid,
        errorDecrypting: true,
      }
    } else {
      return {
        uuid: encrypted.uuid,
        content: JSON.parse(content),
        contentKey,
      }
    }
  }

  private async deriveKey(password: string, keyParams: SNRootKeyParams): Promise<SNRootKey> {
    const salt = await this.generateSalt004(keyParams.content004.identifier, keyParams.content004.pw_nonce)
    const derivedKey = this.crypto.argon2(
      password,
      salt,
      V004Algorithm.ArgonIterations,
      V004Algorithm.ArgonMemLimit,
      V004Algorithm.ArgonOutputKeyBytes,
    )

    const partitions = Utils.splitString(derivedKey, 2)
    const masterKey = partitions[0]
    const serverPassword = partitions[1]

    return CreateNewRootKey({
      masterKey,
      serverPassword,
      version: ProtocolVersion.V004,
      keyParams: keyParams.getPortableValue(),
    })
  }

  generateKeyPair(): PkcKeyPair {
    return this.crypto.sodiumCryptoBoxGenerateKeypair()
  }

  asymmetricEncryptKey(
    keyToEncrypt: HexString,
    senderSecretKey: HexString,
    recipientPublicKey: HexString,
  ): AsymmetricallyEncryptedKey {
    const nonce = this.crypto.generateRandomKey(V004Algorithm.AsymmetricEncryptionNonceLength)

    const ciphertext = this.crypto.sodiumCryptoBoxEasyEncrypt(keyToEncrypt, nonce, senderSecretKey, recipientPublicKey)

    return [AsymmetricCiphertextPrefix, nonce, ciphertext].join(':')
  }

  asymmetricDecryptKey(
    keyToDecrypt: AsymmetricallyEncryptedKey,
    senderPublicKey: HexString,
    recipientSecretKey: HexString,
  ): Utf8String {
    const components = keyToDecrypt.split(':')

    const nonce = components[1]
    const keyString = components[2]

    return this.crypto.sodiumCryptoBoxEasyDecrypt(keyString, nonce, senderPublicKey, recipientSecretKey)
  }

  asymmetricAnonymousEncryptKey(keyToEncrypt: HexString, recipientPublicKey: HexString): AsymmetricallyEncryptedKey {
    const ciphertext = this.crypto.sodiumCryptoBoxAnonymousEncrypt(keyToEncrypt, recipientPublicKey)

    return [AsymmetricAnonymousCiphertextPrefix, ciphertext].join(':')
  }

  asymmetricAnonymousDecryptKey(
    keyToDecrypt: AsymmetricallyEncryptedKey,
    recipientPublicKey: HexString,
    recipientSecretKey: HexString,
  ): Utf8String {
    const components = keyToDecrypt.split(':')

    const ciphertext = components[1]

    return this.crypto.sodiumCryptoBoxAnonymousDecrypt(ciphertext, recipientPublicKey, recipientSecretKey)
  }

  symmetricEncryptPrivateKey(privateKey: HexString, symmetricKey: HexString): SymmetricallyEncryptedPrivateKey {
    if (symmetricKey.length !== 64) {
      throw new Error('Symmetric key length must be 256 bits')
    }

    const nonce = this.crypto.generateRandomKey(V004Algorithm.SymmetricEncryptionNonceLength)

    const encryptedKey = this.crypto.xchacha20Encrypt(privateKey, nonce, symmetricKey)

    return [SymmetricCiphertextPrefix, nonce, encryptedKey].join(':')
  }

  symmetricDecryptPrivateKey(
    encryptedPrivateKey: SymmetricallyEncryptedPrivateKey,
    symmetricKey: HexString,
  ): HexString | null {
    if (symmetricKey.length !== 64) {
      throw new Error('Symmetric key length must be 256 bits')
    }

    const components = encryptedPrivateKey.split(':')

    const nonce = components[1]
    const keyString = components[2]

    return this.crypto.xchacha20Decrypt(keyString, nonce, symmetricKey)
  }

  versionForEncryptedKey(encryptedKey: string): ProtocolVersion {
    const firstComponent = encryptedKey.split(':')[0]
    const version = firstComponent.split('_')[0]
    return version as ProtocolVersion
  }
}

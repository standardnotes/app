import { ContentType, KeyParamsOrigination, ProtocolVersion } from '@standardnotes/common'
import {
  CreateDecryptedItemFromPayload,
  ItemContent,
  ItemsKeyInterface,
  PayloadTimestampDefaults,
  DecryptedPayload,
  DecryptedPayloadInterface,
  KeySystemItemsKeyInterface,
  DecryptedTransferPayload,
  KeySystemRootKeyInterface,
  isKeySystemRootKey,
  KeySystemRootKeyContentSpecialized,
  KeySystemItemsKeyContentSpecialized,
  FillItemContentSpecialized,
  ItemsKeyContentSpecialized,
  KeySystemIdentifier,
  RootKeyInterface,
} from '@standardnotes/models'
import { HexString, PkcKeyPair, PureCryptoInterface } from '@standardnotes/sncrypto-common'
import * as Utils from '@standardnotes/utils'
import { V004Algorithm } from '../../Algorithm'
import { isItemsKey } from '../../Keys/ItemsKey/ItemsKey'
import {
  ContentTypeUsesRootKeyEncryption,
  CreateNewRootKey,
  ItemContentTypeUsesKeySystemRootKeyEncryption,
} from '../../Keys/RootKey/Functions'
import { Create004KeyParams } from '../../Keys/RootKey/KeyParamsFunctions'
import { SNRootKey } from '../../Keys/RootKey/RootKey'
import { SNRootKeyParams } from '../../Keys/RootKey/RootKeyParams'
import { DecryptedParameters, EncryptedParameters, ErrorDecryptingParameters } from '../../Types/EncryptedParameters'
import { ItemAuthenticatedData } from '../../Types/ItemAuthenticatedData'
import { LegacyAttachedData } from '../../Types/LegacyAttachedData'
import { RootKeyEncryptedAuthenticatedData } from '../../Types/RootKeyEncryptedAuthenticatedData'
import { OperatorInterface } from '../OperatorInterface'
import { isKeySystemItemsKey } from '../../Keys/KeySystemItemsKey/KeySystemItemsKey'
import { AsymmetricallyEncryptedString } from '../Types'
import { KeySystemItemsKeyAuthenticatedData } from '../../Types/KeySystemItemsKeyAuthenticatedData'
import {
  AsymmetricAdditionalData,
  EncryptionAdditionalData,
  SymmetricItemAdditionalData,
} from '../../Types/ItemAdditionalData'
import {
  V004AsymmetricCiphertextPrefix,
  V004AsymmetricStringComponents,
  V004Components,
  V004StringComponents,
} from './V004Algorithm'

const PARTITION_CHARACTER = ':'

/** Base64 encoding of JSON.stringify({}) */
const EmptyAdditionalDataString = 'e30='

export class SNProtocolOperator004 implements OperatorInterface {
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
    const response = FillItemContentSpecialized<ItemsKeyContentSpecialized>({
      itemsKey: itemsKey,
      version: ProtocolVersion.V004,
    })
    return response
  }

  public createKeySystemRootKeyContent(params: {
    systemIdentifier: KeySystemIdentifier
    systemName: string
  }): KeySystemRootKeyContentSpecialized {
    return {
      systemName: params.systemName,
      systemIdentifier: params.systemIdentifier,
      key: this.crypto.generateRandomKey(V004Algorithm.EncryptionKeyLength),
      keyTimestamp: new Date().getTime(),
      keyVersion: ProtocolVersion.V004,
    }
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

  public createKeySystemItemsKey(uuid: string, keySystemIdentifier: KeySystemIdentifier): KeySystemItemsKeyInterface {
    const key = this.crypto.generateRandomKey(V004Algorithm.EncryptionKeyLength)
    const content = FillItemContentSpecialized<KeySystemItemsKeyContentSpecialized>({
      itemsKey: key,
      keyTimestamp: new Date().getTime(),
      version: ProtocolVersion.V004,
    })

    const transferPayload: DecryptedTransferPayload = {
      uuid: uuid,
      content_type: ContentType.KeySystemItemsKey,
      key_system_identifier: keySystemIdentifier,
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
  public async computeRootKey<K extends RootKeyInterface>(password: string, keyParams: SNRootKeyParams): Promise<K> {
    return this.deriveKey(password, keyParams)
  }

  /**
   * Creates a new root key given an identifier and a user password
   * @param identifier - Plain string representing a unique identifier
   * @param password - Plain string representing raw user password
   */
  public async createRootKey<K extends RootKeyInterface>(
    identifier: string,
    password: string,
    origination: KeyParamsOrigination,
  ): Promise<K> {
    const version = ProtocolVersion.V004
    const seed = this.crypto.generateRandomKey(V004Algorithm.ArgonSaltSeedLength)
    const keyParams = Create004KeyParams({
      identifier: identifier,
      pw_nonce: seed,
      version: version,
      origination: origination,
      created: `${Date.now()}`,
    })

    const rootKey = await this.deriveKey<K>(password, keyParams)
    return rootKey
  }

  private async deriveKey<K extends RootKeyInterface>(password: string, keyParams: SNRootKeyParams): Promise<K> {
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

    const encryptionKeyPairSeed = this.crypto.sodiumCryptoKdfDeriveFromKey(
      masterKey,
      V004Algorithm.EncryptionKeyPairSubKeyNumber,
      V004Algorithm.EncryptionKeyPairSubKeyLength,
      V004Algorithm.EncryptionKeyPairSubKeyContext,
    )
    const encryptionKeyPair = this.crypto.sodiumCryptoBoxSeedKeypair(encryptionKeyPairSeed)

    const signingKeyPairSeed = this.crypto.sodiumCryptoKdfDeriveFromKey(
      masterKey,
      V004Algorithm.SigningKeyPairSubKeyNumber,
      V004Algorithm.SigningKeyPairSubKeyLength,
      V004Algorithm.SigningKeyPairSubKeyContext,
    )
    const signingKeyPair = this.crypto.sodiumCryptoSignSeedKeypair(signingKeyPairSeed)

    return CreateNewRootKey<K>({
      masterKey,
      serverPassword,
      version: ProtocolVersion.V004,
      keyParams: keyParams.getPortableValue(),
      encryptionKeyPair,
      signingKeyPair,
    })
  }

  /**
   * @param plaintext - The plaintext to encrypt.
   * @param rawKey - The key to use to encrypt the plaintext.
   * @param nonce - The nonce for encryption.
   * @param authenticatedData - JavaScript object (will be stringified) representing
                'Additional authenticated data': data you want to be included in authentication.
   */
  encryptString004(
    plaintext: string,
    rawKey: string,
    nonce: string,
    authenticatedData: ItemAuthenticatedData | KeySystemItemsKeyAuthenticatedData,
  ): string {
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
  private decryptString004(
    ciphertext: string,
    rawKey: string,
    nonce: string,
    rawAuthenticatedData: string,
  ): string | null {
    return this.crypto.xchacha20Decrypt(ciphertext, nonce, rawKey, rawAuthenticatedData)
  }

  generateEncryptionNonce(): string {
    return this.crypto.generateRandomKey(V004Algorithm.EncryptionNonceLength)
  }

  /**
   * @param plaintext  The plaintext text to decrypt.
   * @param rawKey  The key to use to encrypt the plaintext.
   */
  generateEncryptedProtocolString(
    plaintext: string,
    rawKey: string,
    authenticatedData: ItemAuthenticatedData | KeySystemItemsKeyAuthenticatedData,
    signingKeyPair?: PkcKeyPair,
  ) {
    const nonce = this.generateEncryptionNonce()

    const ciphertext = this.encryptString004(plaintext, rawKey, nonce, authenticatedData)

    let additionalData: SymmetricItemAdditionalData
    if (signingKeyPair) {
      additionalData = {
        signing: {
          publicKey: signingKeyPair.publicKey,
          signature: this.crypto.sodiumCryptoSign(ciphertext, signingKeyPair.privateKey),
        },
      }
    } else {
      additionalData = {}
    }

    const components: V004StringComponents = [
      ProtocolVersion.V004 as string,
      nonce,
      ciphertext,
      this.authenticatedDataToString(authenticatedData),
      this.additionalDataToString(additionalData),
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
      additionalData: components[4] ?? EmptyAdditionalDataString,
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
    key: ItemsKeyInterface | KeySystemItemsKeyInterface | KeySystemRootKeyInterface | SNRootKey,
  ): ItemAuthenticatedData | RootKeyEncryptedAuthenticatedData | KeySystemItemsKeyAuthenticatedData {
    const baseData: ItemAuthenticatedData = {
      u: payload.uuid,
      v: ProtocolVersion.V004,
    }

    if (payload.key_system_identifier) {
      baseData.ksi = payload.key_system_identifier
    }

    if (payload.shared_vault_uuid) {
      baseData.svu = payload.shared_vault_uuid
    }

    if (ContentTypeUsesRootKeyEncryption(payload.content_type)) {
      return {
        ...baseData,
        kp: (key as SNRootKey).keyParams.content,
      }
    } else if (ItemContentTypeUsesKeySystemRootKeyEncryption(payload.content_type)) {
      if (!isKeySystemRootKey(key)) {
        throw Error(
          `Attempting to use non-key system root key ${key.content_type} for item content type ${payload.content_type}`,
        )
      }
      return {
        ...baseData,
        keyTimestamp: key.keyTimestamp,
        keyVersion: key.keyVersion,
      }
    } else {
      if (!isItemsKey(key) && !isKeySystemItemsKey(key)) {
        throw Error('Attempting to use non-items key for regular item.')
      }
      return baseData
    }
  }

  private authenticatedDataToString(attachedData: ItemAuthenticatedData | KeySystemItemsKeyAuthenticatedData): string {
    return this.crypto.base64Encode(JSON.stringify(Utils.sortedCopy(Utils.omitUndefinedCopy(attachedData))))
  }

  private additionalDataToString(additionalData: EncryptionAdditionalData): string {
    return this.crypto.base64Encode(JSON.stringify(Utils.sortedCopy(Utils.omitUndefinedCopy(additionalData))))
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

  private stringToAdditionalData<A>(rawAdditionalData: string): A {
    return JSON.parse(this.crypto.base64Decode(rawAdditionalData))
  }

  public generateEncryptedParametersSync(
    payload: DecryptedPayloadInterface,
    key: ItemsKeyInterface | KeySystemItemsKeyInterface | KeySystemRootKeyInterface | SNRootKey,
    signingKeyPair?: PkcKeyPair,
  ): EncryptedParameters {
    const authenticatedData = this.generateAuthenticatedDataForPayload(payload, key)

    const contentKey = this.crypto.generateRandomKey(V004Algorithm.EncryptionKeyLength)
    const encryptedContentKey = this.generateEncryptedProtocolString(
      contentKey,
      key.itemsKey,
      authenticatedData,
      signingKeyPair,
    )

    const contentPlaintext = JSON.stringify(payload.content)
    const encryptedContentString = this.generateEncryptedProtocolString(
      contentPlaintext,
      contentKey,
      authenticatedData,
      signingKeyPair,
    )

    return {
      uuid: payload.uuid,
      items_key_id: isItemsKey(key) || isKeySystemItemsKey(key) ? key.uuid : undefined,
      content: encryptedContentString,
      enc_item_key: encryptedContentKey,
      version: this.version,
    }
  }

  public generateDecryptedParametersSync<C extends ItemContent = ItemContent>(
    encrypted: EncryptedParameters,
    key: ItemsKeyInterface | KeySystemItemsKeyInterface | KeySystemRootKeyInterface | SNRootKey,
  ): DecryptedParameters<C> | ErrorDecryptingParameters {
    const contentKeyComponents = this.deconstructEncryptedPayloadString(encrypted.enc_item_key)
    const contentKeyAuthenticatedData = this.stringToAuthenticatedData(contentKeyComponents.authenticatedData, {
      u: encrypted.uuid,
      v: encrypted.version,
    })

    const useAuthenticatedString = this.authenticatedDataToString(contentKeyAuthenticatedData)
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
    }

    const contentKeyAdditionalData = this.stringToAdditionalData<SymmetricItemAdditionalData>(
      contentKeyComponents.additionalData,
    )
    const contentAdditionalData = this.stringToAdditionalData<SymmetricItemAdditionalData>(
      contentComponents.additionalData,
    )

    const contentKeySignatureVerified = contentKeyAdditionalData.signing
      ? this.crypto.sodiumCryptoSignVerify(
          contentKeyComponents.ciphertext,
          contentKeyAdditionalData.signing.signature,
          contentKeyAdditionalData.signing.publicKey,
        )
      : undefined

    const contentSignatureVerified = contentAdditionalData.signing
      ? this.crypto.sodiumCryptoSignVerify(
          contentComponents.ciphertext,
          contentAdditionalData.signing.signature,
          contentAdditionalData.signing.publicKey,
        )
      : undefined

    return {
      uuid: encrypted.uuid,
      content: JSON.parse(content),
      signatureVerified: contentKeySignatureVerified && contentSignatureVerified,
    }
  }

  asymmetricEncrypt(dto: {
    stringToEncrypt: HexString
    senderSecretKey: HexString
    senderSigningKeyPair: PkcKeyPair
    recipientPublicKey: HexString
  }): AsymmetricallyEncryptedString {
    const nonce = this.crypto.generateRandomKey(V004Algorithm.AsymmetricEncryptionNonceLength)

    const ciphertext = this.crypto.sodiumCryptoBoxEasyEncrypt(
      dto.stringToEncrypt,
      nonce,
      dto.senderSecretKey,
      dto.recipientPublicKey,
    )

    const additionalData = this.additionalDataToString({
      signing: {
        publicKey: dto.senderSigningKeyPair.publicKey,
        signature: this.crypto.sodiumCryptoSign(ciphertext, dto.senderSigningKeyPair.privateKey),
      },
    })

    const components: V004AsymmetricStringComponents = [
      V004AsymmetricCiphertextPrefix,
      nonce,
      ciphertext,
      additionalData,
    ]

    return components.join(':')
  }

  asymmetricDecrypt(dto: {
    stringToDecrypt: AsymmetricallyEncryptedString
    senderPublicKey: HexString
    senderSigningPublicKey: HexString
    recipientSecretKey: HexString
  }): { plaintext: HexString; signatureVerified: boolean } | null {
    const [_, nonce, ciphertext, additionalDataString] = <V004AsymmetricStringComponents>dto.stringToDecrypt.split(':')

    try {
      const plaintext = this.crypto.sodiumCryptoBoxEasyDecrypt(
        ciphertext,
        nonce,
        dto.senderPublicKey,
        dto.recipientSecretKey,
      )

      const additionalData = this.stringToAdditionalData<AsymmetricAdditionalData>(additionalDataString)

      const signatureVerified = this.crypto.sodiumCryptoSignVerify(
        ciphertext,
        additionalData.signing.signature,
        additionalData.signing.publicKey,
      )

      return {
        plaintext,
        signatureVerified,
      }
    } catch (error) {
      return null
    }
  }

  versionForAsymmetricallyEncryptedString(string: string): ProtocolVersion {
    const [versionPrefix] = <V004AsymmetricStringComponents>string.split(':')
    const version = versionPrefix.split('_')[0]
    return version as ProtocolVersion
  }
}

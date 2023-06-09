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
  ClientSignaturePayload,
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
  AsymmetricSigningPayload,
  SigningPayload,
  SymmetricItemSigningPayload,
  SigningPayloadEmbeddedData,
} from '../../Types/EncryptionSigningData'
import {
  V004AsymmetricCiphertextPrefix,
  V004AsymmetricStringComponents,
  V004Components,
  V004StringComponents,
} from './V004Algorithm'

const PARTITION_CHARACTER = ':'

/** Base64 encoding of JSON.stringify({}) */
const EmptySigningDataString = 'e30='

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
      key_system_identifier: undefined,
      shared_vault_uuid: undefined,
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
      shared_vault_uuid: undefined,
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

  private hashString(_string: string): string {
    throw 'Not implemented'
  }

  generateEncryptedProtocolString(
    plaintext: string,
    rawKey: string,
    authenticatedData: ItemAuthenticatedData | KeySystemItemsKeyAuthenticatedData,
    signingData: SymmetricItemSigningPayload,
  ): string {
    const nonce = this.generateEncryptionNonce()

    const ciphertext = this.encryptString004(plaintext, rawKey, nonce, authenticatedData)

    const components: V004StringComponents = [
      ProtocolVersion.V004 as string,
      nonce,
      ciphertext,
      this.authenticatedDataToString(authenticatedData),
      this.signingDataToString(signingData),
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
      signingData: components[4] ?? EmptySigningDataString,
    }
  }

  public getPayloadAuthenticatedData(
    encrypted: EncryptedParameters,
  ): RootKeyEncryptedAuthenticatedData | ItemAuthenticatedData | LegacyAttachedData | undefined {
    const itemKeyComponents = this.deconstructEncryptedPayloadString(encrypted.enc_item_key)
    const authenticatedDataString = itemKeyComponents.authenticatedData
    const result = this.stringToAuthenticatedData(authenticatedDataString, {
      u: encrypted.uuid,
      v: encrypted.version,
      ksi: encrypted.key_system_identifier,
      svu: encrypted.shared_vault_uuid,
    })

    return result
  }

  /**
   * For items that are encrypted with a root key, we append the root key's key params, so
   * that in the event the client/user loses a reference to their root key, they may still
   * decrypt data by regenerating the key based on the attached key params.
   */
  private generateAuthenticatedDataForPayload(
    payload: DecryptedPayloadInterface,
    key: ItemsKeyInterface | KeySystemItemsKeyInterface | KeySystemRootKeyInterface | RootKeyInterface,
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
        kp: (key as RootKeyInterface).keyParams.content,
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

  private signingDataToString(signingData: SigningPayload): string {
    return this.crypto.base64Encode(JSON.stringify(Utils.sortedCopy(Utils.omitUndefinedCopy(signingData))))
  }

  private stringToAuthenticatedData(
    rawAuthenticatedData: string,
    override: ItemAuthenticatedData,
  ): RootKeyEncryptedAuthenticatedData | ItemAuthenticatedData {
    const base = JSON.parse(this.crypto.base64Decode(rawAuthenticatedData))
    return Utils.sortedCopy({
      ...base,
      ...override,
    })
  }

  private stringToSigningData<A>(rawSigningData: string): A {
    return JSON.parse(this.crypto.base64Decode(rawSigningData))
  }

  public generateEncryptedParametersSync(
    payload: DecryptedPayloadInterface,
    key: ItemsKeyInterface | KeySystemItemsKeyInterface | KeySystemRootKeyInterface | RootKeyInterface,
    signingKeyPair?: PkcKeyPair,
  ): EncryptedParameters {
    if (this.doesPayloadRequireSigning(payload) && !signingKeyPair) {
      throw Error('Payload requires signing but no signing key pair was provided.')
    }

    const commonAuthenticatedData = this.generateAuthenticatedDataForPayload(payload, key)

    const contentKey = this.crypto.generateRandomKey(V004Algorithm.EncryptionKeyLength)

    const contentKeyDoesNotNeedToMaintainPersistentSignatures = undefined
    const contentKeySigningDataResult = this.generateSymmetricPlaintextSigningData(
      contentKey,
      contentKeyDoesNotNeedToMaintainPersistentSignatures,
      signingKeyPair,
    )
    const encryptedContentKey = this.generateEncryptedProtocolString(
      contentKey,
      key.itemsKey,
      commonAuthenticatedData,
      contentKeySigningDataResult.signingData,
    )

    const contentPlaintext = JSON.stringify(payload.content)
    const contentSigningDataResult = this.generateSymmetricPlaintextSigningData(
      contentPlaintext,
      payload.decryptedClientSignaturePayload,
      signingKeyPair,
    )
    const encryptedContentString = this.generateEncryptedProtocolString(
      contentPlaintext,
      contentKey,
      commonAuthenticatedData,
      contentSigningDataResult.signingData,
    )

    const encryptedClientSignaturePayload = contentSigningDataResult.signingData.embeddedValue
      ? this.generateEncryptedClientContentSignaturePayload(
          contentSigningDataResult.signingData.embeddedValue,
          contentSigningDataResult.plaintextHash,
          contentKey,
          commonAuthenticatedData,
        )
      : undefined

    return {
      uuid: payload.uuid,
      content_type: payload.content_type,
      items_key_id: isItemsKey(key) || isKeySystemItemsKey(key) ? key.uuid : undefined,
      content: encryptedContentString,
      enc_item_key: encryptedContentKey,
      version: this.version,
      encryptedClientSignaturePayload,
    }
  }

  private generateEncryptedClientContentSignaturePayload(
    contentSigningData: SigningPayloadEmbeddedData,
    contentHash: string,
    contentKey: string,
    commonAuthenticatedData: ItemAuthenticatedData,
  ): string {
    const clientSignaturePayload: ClientSignaturePayload = {
      plaintextHash: contentHash,
      signature: contentSigningData.signature,
      signerPublicKey: contentSigningData.publicKey,
    }

    const nullSigningDataForClientOnlyEncryptedString = {}
    const encryptedClientSignaturePayload = this.generateEncryptedProtocolString(
      JSON.stringify(clientSignaturePayload),
      contentKey,
      commonAuthenticatedData,
      nullSigningDataForClientOnlyEncryptedString,
    )

    return encryptedClientSignaturePayload
  }

  private generateSymmetricPlaintextSigningData(
    payloadPlaintext: string,
    existingSignaturePayload: ClientSignaturePayload | undefined,
    signingKeyPair: PkcKeyPair | undefined,
  ): { signingData: SymmetricItemSigningPayload; plaintextHash: string } {
    const plaintextHash = this.hashString(payloadPlaintext)

    if (existingSignaturePayload) {
      const needsNewSignature = plaintextHash !== existingSignaturePayload.plaintextHash
      if (!needsNewSignature) {
        return {
          signingData: {
            embeddedValue: {
              publicKey: existingSignaturePayload.signerPublicKey,
              signature: existingSignaturePayload.signature,
            },
          },
          plaintextHash,
        }
      }
    }

    if (!signingKeyPair) {
      return {
        signingData: {},
        plaintextHash,
      }
    }

    return {
      signingData: {
        embeddedValue: {
          publicKey: signingKeyPair.publicKey,
          signature: this.crypto.sodiumCryptoSign(plaintextHash, signingKeyPair.privateKey),
        },
      },
      plaintextHash,
    }
  }

  public generateDecryptedParametersSync<C extends ItemContent = ItemContent>(
    encrypted: EncryptedParameters,
    key: ItemsKeyInterface | KeySystemItemsKeyInterface | KeySystemRootKeyInterface | RootKeyInterface,
  ): DecryptedParameters<C> | ErrorDecryptingParameters {
    const contentKeyComponents = this.deconstructEncryptedPayloadString(encrypted.enc_item_key)

    const contentKeyAuthenticatedData = this.stringToAuthenticatedData(contentKeyComponents.authenticatedData, {
      u: encrypted.uuid,
      v: encrypted.version,
      ksi: encrypted.key_system_identifier,
      svu: encrypted.shared_vault_uuid,
    })

    const commonAuthenticatedDataString = this.authenticatedDataToString(contentKeyAuthenticatedData)

    const contentKey = this.decryptString004(
      contentKeyComponents.ciphertext,
      key.itemsKey,
      contentKeyComponents.nonce,
      commonAuthenticatedDataString,
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
      commonAuthenticatedDataString,
    )

    if (!content) {
      return {
        uuid: encrypted.uuid,
        errorDecrypting: true,
      }
    }

    let decryptedClientSignaturePayload: ClientSignaturePayload | undefined
    if (encrypted.encryptedClientSignaturePayload) {
      const signaturePayloadComponents = this.deconstructEncryptedPayloadString(
        encrypted.encryptedClientSignaturePayload,
      )

      const decryptedClientSignatureString = this.decryptString004(
        signaturePayloadComponents.ciphertext,
        contentKey,
        signaturePayloadComponents.nonce,
        commonAuthenticatedDataString,
      )

      if (decryptedClientSignatureString) {
        decryptedClientSignaturePayload = JSON.parse(decryptedClientSignatureString)
      }
    }

    const signatureVerificationResult = this.performSigningVerificationForSymmtetricallyEncryptedItem(
      encrypted,
      contentKeyComponents,
      contentComponents,
    )

    return {
      uuid: encrypted.uuid,
      content: JSON.parse(content),
      signature: signatureVerificationResult,
      decryptedClientSignaturePayload,
    }
  }

  private doesPayloadRequireSigning(payload: { key_system_identifier?: string; shared_vault_uuid?: string }) {
    return payload.key_system_identifier != undefined || payload.shared_vault_uuid != undefined
  }

  private performSigningVerificationForSymmtetricallyEncryptedItem(
    encrypted: EncryptedParameters,
    contentKeyComponents: V004Components,
    contentComponents: V004Components,
  ): DecryptedParameters['signature'] {
    const contentKeySigningPayload = this.stringToSigningData<SymmetricItemSigningPayload>(
      contentKeyComponents.signingData,
    )

    const contentSigningPayload = this.stringToSigningData<SymmetricItemSigningPayload>(contentComponents.signingData)

    const verificationRequired = this.doesPayloadRequireSigning(encrypted)

    if (!contentKeySigningPayload.embeddedValue || !contentSigningPayload.embeddedValue) {
      if (verificationRequired) {
        return {
          required: true,
          result: {
            passes: false,
            publicKey: '',
          },
        }
      }
      return {
        required: false,
      }
    }

    if (contentKeySigningPayload.embeddedValue.publicKey !== contentSigningPayload.embeddedValue.publicKey) {
      return {
        required: verificationRequired,
        result: {
          passes: false,
          publicKey: '',
        },
      }
    }

    const contentKeySignatureVerified = this.crypto.sodiumCryptoSignVerify(
      contentKeyComponents.ciphertext,
      contentKeySigningPayload.embeddedValue.signature,
      contentKeySigningPayload.embeddedValue.publicKey,
    )

    const contentSignatureVerified = this.crypto.sodiumCryptoSignVerify(
      contentComponents.ciphertext,
      contentSigningPayload.embeddedValue.signature,
      contentSigningPayload.embeddedValue.publicKey,
    )

    return {
      required: verificationRequired,
      result: {
        passes: contentKeySignatureVerified && contentSignatureVerified,
        publicKey: contentKeySigningPayload.embeddedValue.publicKey,
      },
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

    const signingData = this.signingDataToString({
      embeddedValue: {
        publicKey: dto.senderSigningKeyPair.publicKey,
        signature: this.crypto.sodiumCryptoSign(ciphertext, dto.senderSigningKeyPair.privateKey),
      },
    })

    const components: V004AsymmetricStringComponents = [V004AsymmetricCiphertextPrefix, nonce, ciphertext, signingData]

    return components.join(':')
  }

  asymmetricDecrypt(dto: {
    stringToDecrypt: AsymmetricallyEncryptedString
    senderPublicKey: HexString
    recipientSecretKey: HexString
  }): { plaintext: HexString; signatureVerified: boolean; signaturePublicKey: string } | null {
    const [_, nonce, ciphertext, signingDataString] = <V004AsymmetricStringComponents>dto.stringToDecrypt.split(':')

    try {
      const plaintext = this.crypto.sodiumCryptoBoxEasyDecrypt(
        ciphertext,
        nonce,
        dto.senderPublicKey,
        dto.recipientSecretKey,
      )

      const signingData = this.stringToSigningData<AsymmetricSigningPayload>(signingDataString)

      const signatureVerified = this.crypto.sodiumCryptoSignVerify(
        ciphertext,
        signingData.embeddedValue.signature,
        signingData.embeddedValue.publicKey,
      )

      return {
        plaintext,
        signatureVerified,
        signaturePublicKey: signingData.embeddedValue.publicKey,
      }
    } catch (error) {
      return null
    }
  }

  getSignerPublicKeyFromAsymmetricallyEncryptedString(string: AsymmetricallyEncryptedString): HexString {
    const [_, __, ___, signingDataString] = <V004AsymmetricStringComponents>string.split(':')
    const signingData = this.stringToSigningData<AsymmetricSigningPayload>(signingDataString)
    return signingData.embeddedValue.publicKey
  }

  versionForAsymmetricallyEncryptedString(string: string): ProtocolVersion {
    const [versionPrefix] = <V004AsymmetricStringComponents>string.split(':')
    const version = versionPrefix.split('_')[0]
    return version as ProtocolVersion
  }
}

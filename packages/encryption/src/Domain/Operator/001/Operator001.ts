import { ContentType, KeyParamsOrigination, ProtocolVersion, ProtocolVersionLength } from '@standardnotes/common'
import {
  CreateDecryptedItemFromPayload,
  DecryptedPayload,
  DecryptedPayloadInterface,
  FillItemContent,
  ItemContent,
  ItemsKeyContent,
  ItemsKeyInterface,
  PayloadTimestampDefaults,
} from '@standardnotes/models'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { firstHalfOfString, secondHalfOfString, splitString, UuidGenerator } from '@standardnotes/utils'
import { V001Algorithm } from '../../Algorithm'
import { isItemsKey } from '../../Keys/ItemsKey/ItemsKey'
import { CreateNewRootKey } from '../../Keys/RootKey/Functions'
import { Create001KeyParams } from '../../Keys/RootKey/KeyParamsFunctions'
import { SNRootKey } from '../../Keys/RootKey/RootKey'
import { SNRootKeyParams } from '../../Keys/RootKey/RootKeyParams'
import { DecryptedParameters, EncryptedParameters, ErrorDecryptingParameters } from '../../Types/EncryptedParameters'
import { ItemAuthenticatedData } from '../../Types/ItemAuthenticatedData'
import { LegacyAttachedData } from '../../Types/LegacyAttachedData'
import { RootKeyEncryptedAuthenticatedData } from '../../Types/RootKeyEncryptedAuthenticatedData'
import { AsynchronousOperator } from '../Operator'

const NO_IV = '00000000000000000000000000000000'

/**
 * @deprecated
 * A legacy operator no longer used to generate new accounts
 */
export class SNProtocolOperator001 implements AsynchronousOperator {
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
      content_type: ContentType.ItemsKey,
      content: this.generateNewItemsKeyContent(),
      ...PayloadTimestampDefaults(),
    })
    return CreateDecryptedItemFromPayload(payload)
  }

  public async createRootKey(
    identifier: string,
    password: string,
    origination: KeyParamsOrigination,
  ): Promise<SNRootKey> {
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

  public getPayloadAuthenticatedData(
    _encrypted: EncryptedParameters,
  ): RootKeyEncryptedAuthenticatedData | ItemAuthenticatedData | LegacyAttachedData | undefined {
    return undefined
  }

  public async computeRootKey(password: string, keyParams: SNRootKeyParams): Promise<SNRootKey> {
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
  ): Promise<EncryptedParameters> {
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
      items_key_id: isItemsKey(key) ? key.uuid : undefined,
      content: ciphertext,
      enc_item_key: encItemKey,
      auth_hash: authHash,
      version: this.version,
    }
  }

  public async generateDecryptedParametersAsync<C extends ItemContent = ItemContent>(
    encrypted: EncryptedParameters,
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

  protected async deriveKey(password: string, keyParams: SNRootKeyParams): Promise<SNRootKey> {
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

    return CreateNewRootKey({
      serverPassword: partitions[0],
      masterKey: partitions[1],
      version: ProtocolVersion.V001,
      keyParams: keyParams.getPortableValue(),
    })
  }
}

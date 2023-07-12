import * as Common from '@standardnotes/common'
import * as Models from '@standardnotes/models'
import { ContentType } from '@standardnotes/domain-core'
import { ItemContent, PayloadTimestampDefaults } from '@standardnotes/models'
import * as Utils from '@standardnotes/utils'
import { UuidGenerator } from '@standardnotes/utils'
import { V002Algorithm } from '../../Algorithm'
import { isItemsKey } from '../../Keys/ItemsKey/ItemsKey'
import { CreateNewRootKey } from '../../Keys/RootKey/Functions'
import { Create002KeyParams } from '../../Keys/RootKey/KeyParamsFunctions'
import { SNRootKey } from '../../Keys/RootKey/RootKey'
import { SNRootKeyParams } from '../../Keys/RootKey/RootKeyParams'
import { EncryptedOutputParameters, ErrorDecryptingParameters } from '../../Types/EncryptedParameters'
import { DecryptedParameters } from '../../Types/DecryptedParameters'
import { ItemAuthenticatedData } from '../../Types/ItemAuthenticatedData'
import { LegacyAttachedData } from '../../Types/LegacyAttachedData'
import { RootKeyEncryptedAuthenticatedData } from '../../Types/RootKeyEncryptedAuthenticatedData'
import { SNProtocolOperator001 } from '../001/Operator001'

/**
 * @deprecated
 * A legacy operator no longer used to generate new accounts.
 */
export class SNProtocolOperator002 extends SNProtocolOperator001 {
  override get version(): Common.ProtocolVersion {
    return Common.ProtocolVersion.V002
  }

  protected override generateNewItemsKeyContent(): Models.ItemsKeyContent {
    const keyLength = V002Algorithm.EncryptionKeyLength
    const itemsKey = this.crypto.generateRandomKey(keyLength)
    const authKey = this.crypto.generateRandomKey(keyLength)
    const response = Models.FillItemContent<Models.ItemsKeyContent>({
      itemsKey: itemsKey,
      dataAuthenticationKey: authKey,
      version: Common.ProtocolVersion.V002,
    })
    return response
  }

  /**
   * Creates a new random items key to use for item encryption.
   * The consumer must save/sync this item.
   */
  public override createItemsKey(): Models.ItemsKeyInterface {
    const payload = new Models.DecryptedPayload({
      uuid: UuidGenerator.GenerateUuid(),
      content_type: ContentType.TYPES.ItemsKey,
      content: this.generateNewItemsKeyContent(),
      ...PayloadTimestampDefaults(),
    })
    return Models.CreateDecryptedItemFromPayload(payload)
  }

  public override async createRootKey<K extends Models.RootKeyInterface>(
    identifier: string,
    password: string,
    origination: Common.KeyParamsOrigination,
  ): Promise<K> {
    const pwCost = Utils.lastElement(V002Algorithm.PbkdfCostsUsed) as number
    const pwNonce = this.crypto.generateRandomKey(V002Algorithm.SaltSeedLength)
    const pwSalt = await this.crypto.unsafeSha1(identifier + ':' + pwNonce)

    const keyParams = Create002KeyParams({
      email: identifier,
      pw_nonce: pwNonce,
      pw_cost: pwCost,
      pw_salt: pwSalt,
      version: Common.ProtocolVersion.V002,
      origination,
      created: `${Date.now()}`,
    })

    return this.deriveKey(password, keyParams)
  }

  /**
   * Note that version 002 supported "dynamic" iteration counts. Some accounts
   * may have had costs of 5000, and others of 101000. Therefore, when computing
   * the root key, we must use the value returned by the server.
   */
  public override async computeRootKey<K extends Models.RootKeyInterface>(
    password: string,
    keyParams: SNRootKeyParams,
  ): Promise<K> {
    return this.deriveKey(password, keyParams)
  }

  private async decryptString002(text: string, key: string, iv: string) {
    return this.crypto.aes256CbcDecrypt(text, iv, key)
  }

  private async encryptString002(text: string, key: string, iv: string) {
    return this.crypto.aes256CbcEncrypt(text, iv, key)
  }

  /**
   * @param keyParams Supplied only when encrypting an items key
   */
  private async encryptTextParams(
    string: string,
    encryptionKey: string,
    authKey: string,
    uuid: string,
    version: Common.ProtocolVersion,
    keyParams?: SNRootKeyParams,
  ) {
    const iv = this.crypto.generateRandomKey(V002Algorithm.EncryptionIvLength)
    const contentCiphertext = await this.encryptString002(string, encryptionKey, iv)
    const ciphertextToAuth = [version, uuid, iv, contentCiphertext].join(':')
    const authHash = await this.crypto.hmac256(ciphertextToAuth, authKey)

    if (!authHash) {
      throw Error('Error generating hmac256 authHash')
    }

    const components: string[] = [version as string, authHash, uuid, iv, contentCiphertext]
    if (keyParams) {
      const keyParamsString = this.crypto.base64Encode(JSON.stringify(keyParams.content))
      components.push(keyParamsString)
    }
    const fullCiphertext = components.join(':')
    return fullCiphertext
  }

  private async decryptTextParams(
    ciphertextToAuth: string,
    contentCiphertext: string,
    encryptionKey: string,
    iv: string,
    authHash: string,
    authKey: string,
  ) {
    if (!encryptionKey) {
      throw 'Attempting to decryptTextParams with null encryptionKey'
    }
    const localAuthHash = await this.crypto.hmac256(ciphertextToAuth, authKey)
    if (!localAuthHash) {
      throw Error('Error generating hmac256 localAuthHash')
    }

    if (this.crypto.timingSafeEqual(authHash, localAuthHash) === false) {
      console.error(Error('Auth hash does not match.'))
      return null
    }
    return this.decryptString002(contentCiphertext, encryptionKey, iv)
  }

  public override getPayloadAuthenticatedDataForExternalUse(
    encrypted: EncryptedOutputParameters,
  ): RootKeyEncryptedAuthenticatedData | ItemAuthenticatedData | LegacyAttachedData | undefined {
    const itemKeyComponents = this.encryptionComponentsFromString002(encrypted.enc_item_key)
    const authenticatedData = itemKeyComponents.keyParams

    if (!authenticatedData) {
      return undefined
    }

    const decoded = JSON.parse(this.crypto.base64Decode(authenticatedData))
    const data: LegacyAttachedData = {
      ...(decoded as Common.AnyKeyParamsContent),
    }
    return data
  }

  public override async generateEncryptedParametersAsync(
    payload: Models.DecryptedPayloadInterface,
    key: Models.ItemsKeyInterface | SNRootKey,
  ): Promise<EncryptedOutputParameters> {
    /**
     * Generate new item key that is double the key size.
     * Will be split to create encryption key and authentication key.
     */
    const itemKey = this.crypto.generateRandomKey(V002Algorithm.EncryptionKeyLength * 2)
    const encItemKey = await this.encryptTextParams(
      itemKey,
      key.itemsKey,
      key.dataAuthenticationKey as string,
      payload.uuid,
      key.keyVersion,
      key instanceof SNRootKey ? (key as SNRootKey).keyParams : undefined,
    )

    const ek = Utils.firstHalfOfString(itemKey)
    const ak = Utils.secondHalfOfString(itemKey)
    const ciphertext = await this.encryptTextParams(
      JSON.stringify(payload.content),
      ek,
      ak,
      payload.uuid,
      key.keyVersion,
      key instanceof SNRootKey ? (key as SNRootKey).keyParams : undefined,
    )

    return {
      uuid: payload.uuid,
      content_type: payload.content_type,
      items_key_id: isItemsKey(key) ? key.uuid : undefined,
      content: ciphertext,
      enc_item_key: encItemKey,
      version: this.version,
      key_system_identifier: payload.key_system_identifier,
      shared_vault_uuid: payload.shared_vault_uuid,
    }
  }

  public override async generateDecryptedParametersAsync<C extends ItemContent = ItemContent>(
    encrypted: EncryptedOutputParameters,
    key: Models.ItemsKeyInterface | SNRootKey,
  ): Promise<DecryptedParameters<C> | ErrorDecryptingParameters> {
    if (!encrypted.enc_item_key) {
      console.error(Error('Missing item encryption key, skipping decryption.'))
      return {
        uuid: encrypted.uuid,
        errorDecrypting: true,
      }
    }

    const encryptedItemKey = encrypted.enc_item_key
    const itemKeyComponents = this.encryptionComponentsFromString002(
      encryptedItemKey,
      key.itemsKey,
      key.dataAuthenticationKey,
    )

    const itemKey = await this.decryptTextParams(
      itemKeyComponents.ciphertextToAuth,
      itemKeyComponents.contentCiphertext,
      itemKeyComponents.encryptionKey as string,
      itemKeyComponents.iv,
      itemKeyComponents.authHash,
      itemKeyComponents.authKey as string,
    )
    if (!itemKey) {
      console.error('Error decrypting item_key parameters', encrypted)
      return {
        uuid: encrypted.uuid,
        errorDecrypting: true,
      }
    }

    const ek = Utils.firstHalfOfString(itemKey)
    const ak = Utils.secondHalfOfString(itemKey)
    const itemParams = this.encryptionComponentsFromString002(encrypted.content, ek, ak)
    const content = await this.decryptTextParams(
      itemParams.ciphertextToAuth,
      itemParams.contentCiphertext,
      itemParams.encryptionKey as string,
      itemParams.iv,
      itemParams.authHash,
      itemParams.authKey as string,
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
        signatureData: { required: false, contentHash: '' },
      }
    }
  }

  protected override async deriveKey<K extends Models.RootKeyInterface>(
    password: string,
    keyParams: SNRootKeyParams,
  ): Promise<K> {
    const derivedKey = await this.crypto.pbkdf2(
      password,
      keyParams.content002.pw_salt,
      keyParams.content002.pw_cost,
      V002Algorithm.PbkdfOutputLength,
    )

    if (!derivedKey) {
      throw Error('Error deriving PBKDF2 key')
    }

    const partitions = Utils.splitString(derivedKey, 3)

    return CreateNewRootKey<K>({
      serverPassword: partitions[0],
      masterKey: partitions[1],
      dataAuthenticationKey: partitions[2],
      version: Common.ProtocolVersion.V002,
      keyParams: keyParams.getPortableValue(),
    })
  }

  private encryptionComponentsFromString002(string: string, encryptionKey?: string, authKey?: string) {
    const components = string.split(':')
    return {
      encryptionVersion: components[0],
      authHash: components[1],
      uuid: components[2],
      iv: components[3],
      contentCiphertext: components[4],
      keyParams: components[5],
      ciphertextToAuth: [components[0], components[2], components[3], components[4]].join(':'),
      encryptionKey: encryptionKey,
      authKey: authKey,
    }
  }
}

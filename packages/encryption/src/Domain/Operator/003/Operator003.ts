import { splitString, UuidGenerator } from '@standardnotes/utils'
import {
  CreateDecryptedItemFromPayload,
  DecryptedPayload,
  ItemsKeyContent,
  ItemsKeyInterface,
  FillItemContent,
  PayloadTimestampDefaults,
} from '@standardnotes/models'
import { SNRootKey } from '../../Keys/RootKey/RootKey'
import { V003Algorithm } from '../../Algorithm'
import { Create003KeyParams } from '../../Keys/RootKey/KeyParamsFunctions'
import { SNProtocolOperator002 } from '../002/Operator002'
import { ContentType, KeyParamsOrigination, ProtocolVersion } from '@standardnotes/common'
import { SNRootKeyParams } from '../../Keys/RootKey/RootKeyParams'
import { CreateNewRootKey } from '../../Keys/RootKey/Functions'

/**
 * @legacy
 * Non-expired operator but no longer used for generating new accounts.
 * This operator subclasses the 002 operator to share functionality that has not
 * changed, and overrides functions where behavior may differ.
 */
export class SNProtocolOperator003 extends SNProtocolOperator002 {
  override get version(): ProtocolVersion {
    return ProtocolVersion.V003
  }

  protected override generateNewItemsKeyContent(): ItemsKeyContent {
    const keyLength = V003Algorithm.EncryptionKeyLength
    const itemsKey = this.crypto.generateRandomKey(keyLength)
    const authKey = this.crypto.generateRandomKey(keyLength)
    const response = FillItemContent<ItemsKeyContent>({
      itemsKey: itemsKey,
      dataAuthenticationKey: authKey,
      version: ProtocolVersion.V003,
    })
    return response
  }

  /**
   * Creates a new random items key to use for item encryption.
   * The consumer must save/sync this item.
   */
  public override createItemsKey(): ItemsKeyInterface {
    const content = this.generateNewItemsKeyContent()
    const payload = new DecryptedPayload({
      uuid: UuidGenerator.GenerateUuid(),
      content_type: ContentType.ItemsKey,
      content: FillItemContent(content),
      ...PayloadTimestampDefaults(),
    })
    return CreateDecryptedItemFromPayload(payload)
  }

  public override async computeRootKey(password: string, keyParams: SNRootKeyParams): Promise<SNRootKey> {
    return this.deriveKey(password, keyParams)
  }

  protected override async deriveKey(password: string, keyParams: SNRootKeyParams): Promise<SNRootKey> {
    const salt = await this.generateSalt(
      keyParams.content003.identifier,
      ProtocolVersion.V003,
      V003Algorithm.PbkdfCost,
      keyParams.content003.pw_nonce,
    )

    const derivedKey = await this.crypto.pbkdf2(
      password,
      salt,
      V003Algorithm.PbkdfCost,
      V003Algorithm.PbkdfOutputLength,
    )

    if (!derivedKey) {
      throw Error('Error deriving PBKDF2 key')
    }

    const partitions = splitString(derivedKey, 3)

    return CreateNewRootKey({
      serverPassword: partitions[0],
      masterKey: partitions[1],
      dataAuthenticationKey: partitions[2],
      version: ProtocolVersion.V003,
      keyParams: keyParams.getPortableValue(),
    })
  }

  public override async createRootKey(
    identifier: string,
    password: string,
    origination: KeyParamsOrigination,
  ): Promise<SNRootKey> {
    const version = ProtocolVersion.V003
    const pwNonce = this.crypto.generateRandomKey(V003Algorithm.SaltSeedLength)
    const keyParams = Create003KeyParams({
      identifier: identifier,
      pw_nonce: pwNonce,
      version: version,
      origination: origination,
      created: `${Date.now()}`,
    })
    return this.deriveKey(password, keyParams)
  }

  private async generateSalt(identifier: string, version: ProtocolVersion, cost: number, nonce: string) {
    const result = await this.crypto.sha256([identifier, 'SF', version, cost, nonce].join(':'))
    return result
  }
}

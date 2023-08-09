import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import {
  EncryptedPayloadInterface,
  ItemsKeyInterface,
  RootKeyInterface,
  RootKeyParamsInterface,
  DecryptedPayloadInterface,
  isKeySystemRootKey,
  KeySystemRootKeyInterface,
  KeySystemItemsKeyInterface,
} from '@standardnotes/models'
import { EncryptionProviderInterface } from '../Encryption/EncryptionProviderInterface'
import { DetermineKeyToUse } from './DetermineKeyToUse'
import { isItemsKey, isKeySystemItemsKey } from '@standardnotes/encryption'
import { LoggerInterface } from '@standardnotes/utils'

type EncryptedOrDecrypted = (DecryptedPayloadInterface | EncryptedPayloadInterface)[]

export class DecryptBackupPayloads implements UseCaseInterface<EncryptedOrDecrypted> {
  constructor(
    private encryption: EncryptionProviderInterface,
    private _determineKeyToUse: DetermineKeyToUse,
    private logger: LoggerInterface,
  ) {}

  async execute(dto: {
    payloads: EncryptedPayloadInterface[]
    recentlyDecryptedKeys: (ItemsKeyInterface | KeySystemItemsKeyInterface | KeySystemRootKeyInterface)[]
    rootKey: RootKeyInterface | undefined
    keyParams?: RootKeyParamsInterface
  }): Promise<Result<EncryptedOrDecrypted>> {
    const results: (DecryptedPayloadInterface | EncryptedPayloadInterface)[] = []

    for (const encryptedPayload of dto.payloads) {
      try {
        const key = this._determineKeyToUse
          .execute({
            payload: encryptedPayload,
            recentlyDecryptedKeys: dto.recentlyDecryptedKeys,
            keyParams: dto.keyParams,
            rootKey: dto.rootKey,
          })
          .getValue()

        if (!key) {
          results.push(
            encryptedPayload.copy({
              errorDecrypting: true,
            }),
          )
          continue
        }

        if (isItemsKey(key) || isKeySystemItemsKey(key)) {
          const decryptedPayload = await this.encryption.decryptSplitSingle({
            usesItemsKey: {
              items: [encryptedPayload],
              key: key,
            },
          })
          results.push(decryptedPayload)
        } else if (isKeySystemRootKey(key)) {
          const decryptedPayload = await this.encryption.decryptSplitSingle({
            usesKeySystemRootKey: {
              items: [encryptedPayload],
              key: key,
            },
          })
          results.push(decryptedPayload)
        } else {
          const decryptedPayload = await this.encryption.decryptSplitSingle({
            usesRootKey: {
              items: [encryptedPayload],
              key: key,
            },
          })
          results.push(decryptedPayload)
        }
      } catch (e) {
        results.push(
          encryptedPayload.copy({
            errorDecrypting: true,
          }),
        )
        this.logger.error('Error decrypting payload', encryptedPayload, e)
      }
    }

    return Result.ok(results)
  }
}

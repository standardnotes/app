import { Result, SyncUseCaseInterface } from '@standardnotes/domain-core'
import { compareVersions, leftVersionGreaterThanOrEqualToRight, ProtocolVersion } from '@standardnotes/common'
import {
  ContentTypeUsesKeySystemRootKeyEncryption,
  ContentTypeUsesRootKeyEncryption,
  EncryptedPayloadInterface,
  ItemsKeyInterface,
  KeySystemItemsKeyInterface,
  RootKeyInterface,
  KeySystemRootKeyInterface,
  RootKeyParamsInterface,
} from '@standardnotes/models'
import { EncryptionProviderInterface } from '../Encryption/EncryptionProviderInterface'

type AnyKey = ItemsKeyInterface | RootKeyInterface | KeySystemRootKeyInterface | KeySystemItemsKeyInterface

export class DetermineKeyToUse implements SyncUseCaseInterface<AnyKey | undefined> {
  constructor(private encryption: EncryptionProviderInterface) {}

  execute(dto: {
    payload: EncryptedPayloadInterface
    recentlyDecryptedKeys: ItemsKeyInterface[]
    keyParams?: RootKeyParamsInterface
    rootKey?: RootKeyInterface
  }): Result<AnyKey | undefined> {
    if (ContentTypeUsesRootKeyEncryption(dto.payload.content_type)) {
      if (!dto.rootKey) {
        throw new Error('Attempting to decrypt root key encrypted payload with no root key')
      }
      return Result.ok(dto.rootKey)
    }

    if (ContentTypeUsesKeySystemRootKeyEncryption(dto.payload.content_type)) {
      throw new Error('Backup file key system root key encryption is not supported')
    }

    let itemsKey: ItemsKeyInterface | RootKeyInterface | KeySystemItemsKeyInterface | undefined

    if (dto.payload.items_key_id) {
      itemsKey = this.encryption.itemsKeyForEncryptedPayload(dto.payload)
      if (itemsKey) {
        return Result.ok(itemsKey)
      }
    }

    itemsKey = dto.recentlyDecryptedKeys.find((itemsKeyPayload) => {
      return Result.ok(dto.payload.items_key_id === itemsKeyPayload.uuid)
    })

    if (itemsKey) {
      return Result.ok(itemsKey)
    }

    if (!dto.keyParams) {
      return Result.ok(undefined)
    }

    const payloadVersion = dto.payload.version as ProtocolVersion

    /**
     * Payloads with versions <= 003 use root key directly for encryption.
     * However, if the incoming key params are >= 004, this means we should
     * have an items key based off the 003 root key. We can't use the 004
     * root key directly because it's missing dataAuthenticationKey.
     */
    if (leftVersionGreaterThanOrEqualToRight(dto.keyParams.version, ProtocolVersion.V004)) {
      itemsKey = this.encryption.defaultItemsKeyForItemVersion(payloadVersion, dto.recentlyDecryptedKeys)
    } else if (compareVersions(payloadVersion, ProtocolVersion.V003) <= 0) {
      itemsKey = dto.rootKey
    }

    return Result.ok(itemsKey)
  }
}

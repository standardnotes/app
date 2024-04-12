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
  isKeySystemRootKey,
} from '@standardnotes/models'
import { EncryptionProviderInterface } from '../Encryption/EncryptionProviderInterface'
import { KeySystemKeyManagerInterface } from '../KeySystem/KeySystemKeyManagerInterface'
import { isItemsKey } from '@standardnotes/encryption'

type AnyKey = ItemsKeyInterface | RootKeyInterface | KeySystemRootKeyInterface | KeySystemItemsKeyInterface

export class DetermineKeyToUse implements SyncUseCaseInterface<AnyKey | undefined> {
  constructor(
    private encryption: EncryptionProviderInterface,
    private keys: KeySystemKeyManagerInterface,
  ) {}

  execute(dto: {
    payload: EncryptedPayloadInterface
    recentlyDecryptedKeys: (ItemsKeyInterface | KeySystemItemsKeyInterface | KeySystemRootKeyInterface)[]
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
      if (!dto.payload.key_system_identifier) {
        throw new Error('Attempting to decrypt key system root key encrypted payload with no key system identifier')
      }
      try {
        const recentlyDecrypted = dto.recentlyDecryptedKeys.filter(isKeySystemRootKey)
        let keySystemRootKey = recentlyDecrypted.find(
          (key) => key.systemIdentifier === dto.payload.key_system_identifier,
        )
        if (!keySystemRootKey) {
          keySystemRootKey = this.keys.getPrimaryKeySystemRootKey(dto.payload.key_system_identifier)
        }

        return Result.ok(keySystemRootKey)
      } catch (error) {
        return Result.fail(JSON.stringify(error))
      }
    }

    if (dto.payload.key_system_identifier) {
      const keySystemItemsKey: KeySystemItemsKeyInterface | undefined = dto.recentlyDecryptedKeys.find(
        (key) => key.key_system_identifier === dto.payload.key_system_identifier,
      ) as KeySystemItemsKeyInterface | undefined

      if (keySystemItemsKey) {
        return Result.ok(keySystemItemsKey)
      }
    }

    let itemsKey: ItemsKeyInterface | RootKeyInterface | KeySystemItemsKeyInterface | undefined

    itemsKey = dto.recentlyDecryptedKeys.filter(isItemsKey).find((itemsKeyPayload) => {
      return dto.payload.items_key_id === itemsKeyPayload.uuid
    })

    if (itemsKey) {
      return Result.ok(itemsKey)
    }

    if (dto.payload.items_key_id) {
      itemsKey = this.encryption.itemsKeyForEncryptedPayload(dto.payload)
      if (itemsKey) {
        return Result.ok(itemsKey)
      }
    }

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
      itemsKey = this.encryption.defaultItemsKeyForItemVersion(
        payloadVersion,
        dto.recentlyDecryptedKeys.filter(isItemsKey),
      )
    } else if (compareVersions(payloadVersion, ProtocolVersion.V003) <= 0) {
      itemsKey = dto.rootKey
    }

    return Result.ok(itemsKey)
  }
}

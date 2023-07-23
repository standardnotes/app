import {
  AnyKeyParamsContent,
  compareVersions,
  leftVersionGreaterThanOrEqualToRight,
  ProtocolVersion,
} from '@standardnotes/common'
import {
  BackupFileType,
  CreateAnyKeyParams,
  isItemsKey,
  isKeySystemItemsKey,
  SNItemsKey,
  SplitPayloadsByEncryptionType,
} from '@standardnotes/encryption'
import {
  ContentTypeUsesKeySystemRootKeyEncryption,
  ContentTypeUsesRootKeyEncryption,
  BackupFile,
  CreateDecryptedItemFromPayload,
  CreatePayloadSplit,
  DecryptedPayload,
  DecryptedPayloadInterface,
  EncryptedPayload,
  EncryptedPayloadInterface,
  isDecryptedPayload,
  isDecryptedTransferPayload,
  isEncryptedPayload,
  isEncryptedTransferPayload,
  ItemsKeyContent,
  ItemsKeyInterface,
  PayloadInterface,
  KeySystemItemsKeyInterface,
  RootKeyInterface,
  KeySystemRootKeyInterface,
  isKeySystemRootKey,
  RootKeyParamsInterface,
} from '@standardnotes/models'
import { ClientDisplayableError } from '@standardnotes/responses'
import { extendArray } from '@standardnotes/utils'
import { EncryptionService } from '../EncryptionService'
import { ContentType } from '@standardnotes/domain-core'

export class DecryptBackupFile {
  constructor(private encryption: EncryptionService) {}

  async execute(
    file: BackupFile,
    password?: string,
  ): Promise<ClientDisplayableError | (EncryptedPayloadInterface | DecryptedPayloadInterface)[]> {
    const payloads: (EncryptedPayloadInterface | DecryptedPayloadInterface)[] = file.items.map((item) => {
      if (isEncryptedTransferPayload(item)) {
        return new EncryptedPayload(item)
      } else if (isDecryptedTransferPayload(item)) {
        return new DecryptedPayload(item)
      } else {
        throw Error('Unhandled case in DecryptBackupFile')
      }
    })

    const { encrypted, decrypted } = CreatePayloadSplit(payloads)

    const type = this.getBackupFileType(file, payloads)

    switch (type) {
      case BackupFileType.Corrupt:
        return new ClientDisplayableError('Invalid backup file.')
      case BackupFileType.Encrypted: {
        if (!password) {
          throw Error('Attempting to decrypt encrypted file with no password')
        }

        const keyParamsData = (file.keyParams || file.auth_params) as AnyKeyParamsContent

        const rootKey = await this.encryption.computeRootKey(password, CreateAnyKeyParams(keyParamsData))

        const results = await this.decryptEncrypted({
          password,
          payloads: encrypted,
          rootKey,
          keyParams: CreateAnyKeyParams(keyParamsData),
        })

        return [...decrypted, ...results]
      }
      case BackupFileType.EncryptedWithNonEncryptedItemsKey:
        return [...decrypted, ...(await this.decryptEncryptedWithNonEncryptedItemsKey(payloads))]
      case BackupFileType.FullyDecrypted:
        return [...decrypted, ...encrypted]
    }
  }

  private getBackupFileType(file: BackupFile, payloads: PayloadInterface[]): BackupFileType {
    if (file.keyParams || file.auth_params) {
      return BackupFileType.Encrypted
    } else {
      const hasEncryptedItem = payloads.find(isEncryptedPayload)
      const hasDecryptedItemsKey = payloads.find(
        (payload) => payload.content_type === ContentType.TYPES.ItemsKey && isDecryptedPayload(payload),
      )

      if (hasEncryptedItem && hasDecryptedItemsKey) {
        return BackupFileType.EncryptedWithNonEncryptedItemsKey
      } else if (!hasEncryptedItem) {
        return BackupFileType.FullyDecrypted
      } else {
        return BackupFileType.Corrupt
      }
    }
  }

  private async decryptEncrypted(dto: {
    password: string
    keyParams: RootKeyParamsInterface
    payloads: EncryptedPayloadInterface[]
    rootKey: RootKeyInterface
  }): Promise<(EncryptedPayloadInterface | DecryptedPayloadInterface)[]> {
    const results: (EncryptedPayloadInterface | DecryptedPayloadInterface)[] = []

    const { rootKeyEncryption, itemsKeyEncryption } = SplitPayloadsByEncryptionType(dto.payloads)

    const rootKeyBasedDecryptionResults = await this.encryption.decryptSplit({
      usesRootKey: {
        items: rootKeyEncryption || [],
        key: dto.rootKey,
      },
    })

    extendArray(results, rootKeyBasedDecryptionResults)

    const decryptedPayloads = await this.decrypt({
      payloads: itemsKeyEncryption || [],
      availableItemsKeys: rootKeyBasedDecryptionResults
        .filter(isItemsKey)
        .filter(isDecryptedPayload)
        .map((p) => CreateDecryptedItemFromPayload(p)),
      keyParams: dto.keyParams,
      rootKey: dto.rootKey,
    })

    extendArray(results, decryptedPayloads)

    return results
  }

  private async decryptEncryptedWithNonEncryptedItemsKey(
    payloads: (EncryptedPayloadInterface | DecryptedPayloadInterface)[],
  ): Promise<(EncryptedPayloadInterface | DecryptedPayloadInterface)[]> {
    const decryptedItemsKeys: DecryptedPayloadInterface<ItemsKeyContent>[] = []
    const encryptedPayloads: EncryptedPayloadInterface[] = []

    payloads.forEach((payload) => {
      if (payload.content_type === ContentType.TYPES.ItemsKey && isDecryptedPayload(payload)) {
        decryptedItemsKeys.push(payload as DecryptedPayloadInterface<ItemsKeyContent>)
      } else if (isEncryptedPayload(payload)) {
        encryptedPayloads.push(payload)
      }
    })

    const itemsKeys = decryptedItemsKeys.map((p) => CreateDecryptedItemFromPayload<ItemsKeyContent, SNItemsKey>(p))

    return this.decrypt({ payloads: encryptedPayloads, availableItemsKeys: itemsKeys, rootKey: undefined })
  }

  private findKeyToUseForPayload(dto: {
    payload: EncryptedPayloadInterface
    availableKeys: ItemsKeyInterface[]
    keyParams?: RootKeyParamsInterface
    rootKey?: RootKeyInterface
  }): ItemsKeyInterface | RootKeyInterface | KeySystemRootKeyInterface | KeySystemItemsKeyInterface | undefined {
    if (ContentTypeUsesRootKeyEncryption(dto.payload.content_type)) {
      if (!dto.rootKey) {
        throw new Error('Attempting to decrypt root key encrypted payload with no root key')
      }
      return dto.rootKey
    }

    if (ContentTypeUsesKeySystemRootKeyEncryption(dto.payload.content_type)) {
      throw new Error('Backup file key system root key encryption is not supported')
    }

    let itemsKey: ItemsKeyInterface | RootKeyInterface | KeySystemItemsKeyInterface | undefined

    if (dto.payload.items_key_id) {
      itemsKey = this.encryption.itemsKeyForEncryptedPayload(dto.payload)
      if (itemsKey) {
        return itemsKey
      }
    }

    itemsKey = dto.availableKeys.find((itemsKeyPayload) => {
      return dto.payload.items_key_id === itemsKeyPayload.uuid
    })

    if (itemsKey) {
      return itemsKey
    }

    if (!dto.keyParams) {
      return undefined
    }

    const payloadVersion = dto.payload.version as ProtocolVersion

    /**
     * Payloads with versions <= 003 use root key directly for encryption.
     * However, if the incoming key params are >= 004, this means we should
     * have an items key based off the 003 root key. We can't use the 004
     * root key directly because it's missing dataAuthenticationKey.
     */
    if (leftVersionGreaterThanOrEqualToRight(dto.keyParams.version, ProtocolVersion.V004)) {
      itemsKey = this.encryption.defaultItemsKeyForItemVersion(payloadVersion, dto.availableKeys)
    } else if (compareVersions(payloadVersion, ProtocolVersion.V003) <= 0) {
      itemsKey = dto.rootKey
    }

    return itemsKey
  }

  private async decrypt(dto: {
    payloads: EncryptedPayloadInterface[]
    availableItemsKeys: ItemsKeyInterface[]
    rootKey: RootKeyInterface | undefined
    keyParams?: RootKeyParamsInterface
  }): Promise<(DecryptedPayloadInterface | EncryptedPayloadInterface)[]> {
    const results: (DecryptedPayloadInterface | EncryptedPayloadInterface)[] = []

    for (const encryptedPayload of dto.payloads) {
      try {
        const key = this.findKeyToUseForPayload({
          payload: encryptedPayload,
          availableKeys: dto.availableItemsKeys,
          keyParams: dto.keyParams,
          rootKey: dto.rootKey,
        })

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
        console.error('Error decrypting payload', encryptedPayload, e)
      }
    }

    return results
  }
}

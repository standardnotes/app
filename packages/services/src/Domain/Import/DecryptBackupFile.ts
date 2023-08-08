import { EncryptionProviderInterface } from './../Encryption/EncryptionProviderInterface'
import { AnyKeyParamsContent } from '@standardnotes/common'
import {
  BackupFileType,
  CreateAnyKeyParams,
  isItemsKey,
  SNItemsKey,
  SplitPayloadsByEncryptionType,
} from '@standardnotes/encryption'
import {
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
} from '@standardnotes/models'
import { extendArray } from '@standardnotes/utils'
import { ContentType, Result, UseCaseInterface } from '@standardnotes/domain-core'
import { GetBackupFileType } from './GetBackupFileType'
import { DecryptBackupPayloads } from './DecryptBackupPayloads'

export class DecryptBackupFile implements UseCaseInterface<(EncryptedPayloadInterface | DecryptedPayloadInterface)[]> {
  constructor(
    private encryption: EncryptionProviderInterface,
    private _getBackupFileType: GetBackupFileType,
    private _decryptBackupPayloads: DecryptBackupPayloads,
  ) {}

  async execute(
    file: BackupFile,
    password?: string,
  ): Promise<Result<(EncryptedPayloadInterface | DecryptedPayloadInterface)[]>> {
    const payloads = this.convertToPayloads(file)

    const type = this._getBackupFileType.execute(file, payloads).getValue()

    if (type === BackupFileType.Corrupt) {
      return Result.fail('Invalid backup file.')
    }

    const { encrypted, decrypted } = CreatePayloadSplit(payloads)

    if (type === BackupFileType.FullyDecrypted) {
      return Result.ok([...decrypted, ...encrypted])
    }

    if (type === BackupFileType.EncryptedWithNonEncryptedItemsKey) {
      const result = await this.handleEncryptedWithNonEncryptedItemsKeyFileType(payloads)
      if (result.isFailed()) {
        return Result.fail(result.getError())
      }
      return Result.ok([...decrypted, ...result.getValue()])
    }

    if (!password) {
      throw Error('Attempting to decrypt encrypted file with no password')
    }

    const results = await this.handleEncryptedFileType({
      payloads: encrypted,
      file,
      password,
    })

    if (results.isFailed()) {
      return Result.fail(results.getError())
    }

    return Result.ok([...decrypted, ...results.getValue()])
  }

  private convertToPayloads(file: BackupFile): (EncryptedPayloadInterface | DecryptedPayloadInterface)[] {
    return file.items.map((item) => {
      if (isEncryptedTransferPayload(item)) {
        return new EncryptedPayload(item)
      } else if (isDecryptedTransferPayload(item)) {
        return new DecryptedPayload(item)
      } else {
        throw Error('Unhandled case in DecryptBackupFile')
      }
    })
  }

  private async handleEncryptedFileType(dto: {
    file: BackupFile
    password: string
    payloads: EncryptedPayloadInterface[]
  }): Promise<Result<(EncryptedPayloadInterface | DecryptedPayloadInterface)[]>> {
    const keyParams = CreateAnyKeyParams((dto.file.keyParams || dto.file.auth_params) as AnyKeyParamsContent)
    const rootKey = await this.encryption.computeRootKey(dto.password, keyParams)

    const results: (EncryptedPayloadInterface | DecryptedPayloadInterface)[] = []

    const { rootKeyEncryption, itemsKeyEncryption } = SplitPayloadsByEncryptionType(dto.payloads)

    const rootKeyBasedDecryptionResults = await this.encryption.decryptSplit({
      usesRootKey: {
        items: rootKeyEncryption || [],
        key: rootKey,
      },
    })

    extendArray(results, rootKeyBasedDecryptionResults)

    const decryptedPayloads = await this._decryptBackupPayloads.execute({
      payloads: itemsKeyEncryption || [],
      recentlyDecryptedKeys: rootKeyBasedDecryptionResults
        .filter(isItemsKey)
        .filter(isDecryptedPayload)
        .map((p) => CreateDecryptedItemFromPayload(p)),
      keyParams: keyParams,
      rootKey: rootKey,
    })
    if (decryptedPayloads.isFailed()) {
      return Result.fail(decryptedPayloads.getError())
    }

    extendArray(results, decryptedPayloads.getValue())

    return Result.ok(results)
  }

  private async handleEncryptedWithNonEncryptedItemsKeyFileType(
    payloads: (EncryptedPayloadInterface | DecryptedPayloadInterface)[],
  ): Promise<Result<(EncryptedPayloadInterface | DecryptedPayloadInterface)[]>> {
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

    return this._decryptBackupPayloads.execute({
      payloads: encryptedPayloads,
      recentlyDecryptedKeys: itemsKeys,
      rootKey: undefined,
    })
  }
}

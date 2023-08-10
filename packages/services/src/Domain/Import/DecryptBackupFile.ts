import { EncryptionProviderInterface } from './../Encryption/EncryptionProviderInterface'
import { AnyKeyParamsContent } from '@standardnotes/common'
import {
  BackupFileType,
  CreateAnyKeyParams,
  isItemsKey,
  isKeySystemItemsKey,
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
  isKeySystemRootKey,
  ItemsKeyContent,
  ItemsKeyInterface,
  KeySystemItemsKeyInterface,
  KeySystemRootKeyInterface,
} from '@standardnotes/models'
import { extendArray } from '@standardnotes/utils'
import { ContentType, Result, UseCaseInterface } from '@standardnotes/domain-core'
import { GetBackupFileType } from './GetBackupFileType'
import { DecryptBackupPayloads } from './DecryptBackupPayloads'
import { KeySystemKeyManagerInterface } from '../KeySystem/KeySystemKeyManagerInterface'

export class DecryptBackupFile implements UseCaseInterface<(EncryptedPayloadInterface | DecryptedPayloadInterface)[]> {
  constructor(
    private encryption: EncryptionProviderInterface,
    private keys: KeySystemKeyManagerInterface,
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

  /** This is a backup file made from a session which had an encryption source, such as an account or a passcode. */
  private async handleEncryptedFileType(dto: {
    file: BackupFile
    password: string
    payloads: EncryptedPayloadInterface[]
  }): Promise<Result<(EncryptedPayloadInterface | DecryptedPayloadInterface)[]>> {
    const keyParams = CreateAnyKeyParams((dto.file.keyParams || dto.file.auth_params) as AnyKeyParamsContent)
    const rootKey = await this.encryption.computeRootKey(dto.password, keyParams)

    const results: (EncryptedPayloadInterface | DecryptedPayloadInterface)[] = []

    const { rootKeyEncryption, itemsKeyEncryption, keySystemRootKeyEncryption } = SplitPayloadsByEncryptionType(
      dto.payloads,
    )

    /** Decrypts items encrypted with a user root key, such as contacts, synced vault root keys, and items keys */
    const rootKeyBasedDecryptionResults = await this.encryption.decryptSplit({
      usesRootKey: {
        items: rootKeyEncryption || [],
        key: rootKey,
      },
    })

    /** Extract items keys and synced vault root keys from root key decryption results */
    const recentlyDecryptedKeys: (ItemsKeyInterface | KeySystemItemsKeyInterface | KeySystemRootKeyInterface)[] =
      rootKeyBasedDecryptionResults
        .filter((x) => isItemsKey(x) || isKeySystemRootKey(x))
        .filter(isDecryptedPayload)
        .map((p) => CreateDecryptedItemFromPayload(p))

    /**
     * Now handle encrypted keySystemRootKeyEncryption items (vault items keys).  For every encrypted vault items key
     * find the respective vault root key, either from recently decrypted above, or from the key manager. Decrypt the
     * vault items key, and if successful, add it to recentlyDecryptedKeys so that it can be used to decrypt subsequent items
     */
    for (const payload of keySystemRootKeyEncryption ?? []) {
      if (!payload.key_system_identifier) {
        throw new Error('Attempting to decrypt key system root key encrypted payload with no key system identifier')
      }

      const keys = rootKeyBasedDecryptionResults
        .filter(isDecryptedPayload)
        .filter(isKeySystemRootKey)
        .map((p) => CreateDecryptedItemFromPayload(p)) as unknown as KeySystemRootKeyInterface[]

      const key =
        keys.find((k) => k.systemIdentifier === payload.key_system_identifier) ??
        this.keys.getPrimaryKeySystemRootKey(payload.key_system_identifier)

      if (!key) {
        results.push(
          payload.copy({
            errorDecrypting: true,
          }),
        )
        continue
      }

      const result = await this.encryption.decryptSplitSingle({
        usesKeySystemRootKey: {
          items: [payload],
          key,
        },
      })

      if (isDecryptedPayload(result) && isKeySystemItemsKey(result)) {
        recentlyDecryptedKeys.push(CreateDecryptedItemFromPayload(result))
      }

      results.push(result)
    }

    extendArray(results, rootKeyBasedDecryptionResults)

    const payloadsToDecrypt = [...(itemsKeyEncryption ?? [])]

    const decryptedPayloads = await this._decryptBackupPayloads.execute({
      payloads: payloadsToDecrypt,
      recentlyDecryptedKeys: recentlyDecryptedKeys,
      keyParams: keyParams,
      rootKey: rootKey,
    })
    if (decryptedPayloads.isFailed()) {
      return Result.fail(decryptedPayloads.getError())
    }

    extendArray(results, decryptedPayloads.getValue())

    return Result.ok(results)
  }

  /**
   * These are backup files made when not signed into an account and without an encryption source such as a passcode.
   * In this case the items key exists in the backup in plaintext, but the items are encrypted with this items key.
   */
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
}

import { ContentType, Result, SyncUseCaseInterface } from '@standardnotes/domain-core'
import { BackupFileType } from '@standardnotes/encryption'
import { BackupFile, PayloadInterface, isDecryptedPayload, isEncryptedPayload } from '@standardnotes/models'

export class GetBackupFileType implements SyncUseCaseInterface<BackupFileType> {
  execute(file: BackupFile, payloads: PayloadInterface[]): Result<BackupFileType> {
    if (file.keyParams || file.auth_params) {
      return Result.ok(BackupFileType.Encrypted)
    }

    const hasEncryptedItem = payloads.find(isEncryptedPayload)
    const hasDecryptedItemsKey = payloads.find(
      (payload) => payload.content_type === ContentType.TYPES.ItemsKey && isDecryptedPayload(payload),
    )

    if (hasEncryptedItem && hasDecryptedItemsKey) {
      return Result.ok(BackupFileType.EncryptedWithNonEncryptedItemsKey)
    } else if (!hasEncryptedItem) {
      return Result.ok(BackupFileType.FullyDecrypted)
    } else {
      return Result.ok(BackupFileType.Corrupt)
    }
  }
}

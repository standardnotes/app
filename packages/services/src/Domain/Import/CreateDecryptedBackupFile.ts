import { ProtectionsClientInterface } from './../Protection/ProtectionClientInterface'
import { ContentType, Result, UseCaseInterface } from '@standardnotes/domain-core'
import {
  BackupFile,
  CreateDecryptedBackupFileContextPayload,
  CreateEncryptedBackupFileContextPayload,
  isDecryptedPayload,
  isEncryptedPayload,
} from '@standardnotes/models'
import { PayloadManagerInterface } from '../Payloads/PayloadManagerInterface'
import { ProtocolVersionLatest } from '@standardnotes/common'
import { isNotUndefined } from '@standardnotes/utils'

export class CreateDecryptedBackupFile implements UseCaseInterface<BackupFile> {
  constructor(
    private payloads: PayloadManagerInterface,
    private protections: ProtectionsClientInterface,
  ) {}

  async execute(): Promise<Result<BackupFile>> {
    if (!(await this.protections.authorizeBackupCreation())) {
      return Result.fail('Failed to authorize backup creation')
    }

    const payloads = this.payloads.nonDeletedItems.filter((item) => item.content_type !== ContentType.TYPES.ItemsKey)

    const data: BackupFile = {
      version: ProtocolVersionLatest,
      items: payloads
        .map((payload) => {
          if (isDecryptedPayload(payload)) {
            return CreateDecryptedBackupFileContextPayload(payload)
          } else if (isEncryptedPayload(payload)) {
            return CreateEncryptedBackupFileContextPayload(payload)
          }
          return undefined
        })
        .filter(isNotUndefined),
    }

    return Result.ok(data)
  }
}

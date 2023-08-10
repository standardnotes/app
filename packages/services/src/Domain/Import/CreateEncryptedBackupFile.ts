import { ItemManagerInterface } from './../Item/ItemManagerInterface'
import { ProtectionsClientInterface } from './../Protection/ProtectionClientInterface'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import { BackupFile, CreateEncryptedBackupFileContextPayload } from '@standardnotes/models'
import { ProtocolVersionLatest } from '@standardnotes/common'
import { CreateEncryptionSplitWithKeyLookup, SplitPayloadsByEncryptionType } from '@standardnotes/encryption'
import { EncryptionProviderInterface } from '../Encryption/EncryptionProviderInterface'

export class CreateEncryptedBackupFile implements UseCaseInterface<BackupFile> {
  constructor(
    private items: ItemManagerInterface,
    private protections: ProtectionsClientInterface,
    private encryption: EncryptionProviderInterface,
  ) {}

  async execute(params: { skipAuthorization: boolean } = { skipAuthorization: false }): Promise<Result<BackupFile>> {
    if (!params.skipAuthorization && !(await this.protections.authorizeBackupCreation())) {
      return Result.fail('Failed to authorize backup creation')
    }

    const payloads = this.items.items.map((item) => item.payload)

    const split = SplitPayloadsByEncryptionType(payloads)

    const keyLookupSplit = CreateEncryptionSplitWithKeyLookup(split)

    const result = await this.encryption.encryptSplit(keyLookupSplit)

    const ejected = result.map((payload) => CreateEncryptedBackupFileContextPayload(payload))

    const data: BackupFile = {
      version: ProtocolVersionLatest,
      items: ejected,
    }

    const keyParams = this.encryption.getRootKeyParams()
    data.keyParams = keyParams?.getPortableValue()
    return Result.ok(data)
  }
}

import { DecryptBackupFile } from '../Encryption/UseCase/DecryptBackupFile'
import { HistoryServiceInterface } from '../History/HistoryServiceInterface'
import { ChallengeServiceInterface } from '../Challenge/ChallengeServiceInterface'
import { PayloadManagerInterface } from '../Payloads/PayloadManagerInterface'
import { ProtectionsClientInterface } from '../Protection/ProtectionClientInterface'
import { SyncServiceInterface } from '../Sync/SyncServiceInterface'
import { ItemManagerInterface } from '../Item/ItemManagerInterface'
import { ProtocolVersion, compareVersions } from '@standardnotes/common'
import {
  BackupFile,
  BackupFileDecryptedContextualPayload,
  CreateDecryptedBackupFileContextPayload,
  CreateEncryptedBackupFileContextPayload,
  DecryptedItemInterface,
  isDecryptedPayload,
  isEncryptedPayload,
  isEncryptedTransferPayload,
} from '@standardnotes/models'
import { ClientDisplayableError } from '@standardnotes/responses'
import { Challenge, ChallengePrompt, ChallengeReason, ChallengeValidation } from '../Challenge'
import { Result } from '@standardnotes/domain-core'
import { EncryptionProviderInterface } from '../Encryption/EncryptionProviderInterface'

const Strings = {
  UnsupportedBackupFileVersion:
    'This backup file was created using a newer version of the application and cannot be imported here. Please update your application and try again.',
  BackupFileMoreRecentThanAccount:
    "This backup file was created using a newer encryption version than your account's. Please run the available encryption upgrade and try again.",
  FileAccountPassword: 'File account password',
}

export type ImportDataReturnType =
  | {
      affectedItems: DecryptedItemInterface[]
      errorCount: number
    }
  | {
      error: ClientDisplayableError
    }

export class ImportDataUseCase {
  constructor(
    private itemManager: ItemManagerInterface,
    private sync: SyncServiceInterface,
    private protectionService: ProtectionsClientInterface,
    private encryption: EncryptionProviderInterface,
    private payloadManager: PayloadManagerInterface,
    private challengeService: ChallengeServiceInterface,
    private historyService: HistoryServiceInterface,
    private _decryptBackFile: DecryptBackupFile,
  ) {}

  /**
   * @returns
   * .affectedItems: Items that were either created or dirtied by this import
   * .errorCount: The number of items that were not imported due to failure to decrypt.
   */
  async execute(data: BackupFile, awaitSync = false): Promise<ImportDataReturnType> {
    if (data.version) {
      const result = this.validateVersion(data.version)
      if (result.isFailed()) {
        return { error: new ClientDisplayableError(result.getError()) }
      }
    }

    let password: string | undefined

    if (data.auth_params || data.keyParams) {
      const passwordResult = await this.getFilePassword()
      if (passwordResult.isFailed()) {
        return { error: new ClientDisplayableError(passwordResult.getError()) }
      }
      password = passwordResult.getValue()
    }

    if (!(await this.protectionService.authorizeFileImport())) {
      return { error: new ClientDisplayableError('Import aborted') }
    }

    data.items = data.items.map((item) => {
      if (isEncryptedTransferPayload(item)) {
        return CreateEncryptedBackupFileContextPayload(item)
      } else {
        return CreateDecryptedBackupFileContextPayload(item as BackupFileDecryptedContextualPayload)
      }
    })

    const decryptedPayloadsOrError = await this._decryptBackFile.execute(data, password)
    if (decryptedPayloadsOrError instanceof ClientDisplayableError) {
      return { error: decryptedPayloadsOrError }
    }

    const decryptedPayloads = decryptedPayloadsOrError.filter(isDecryptedPayload)
    const encryptedPayloads = decryptedPayloadsOrError.filter(isEncryptedPayload)
    const acceptableEncryptedPayloads = encryptedPayloads.filter((payload) => {
      return payload.key_system_identifier !== undefined
    })
    const importablePayloads = [...decryptedPayloads, ...acceptableEncryptedPayloads]

    const affectedUuids = await this.payloadManager.importPayloads(
      importablePayloads,
      this.historyService.getHistoryMapCopy(),
    )

    const promise = this.sync.sync()
    if (awaitSync) {
      await promise
    }

    const affectedItems = this.itemManager.findItems(affectedUuids) as DecryptedItemInterface[]

    return {
      affectedItems: affectedItems,
      errorCount: decryptedPayloadsOrError.length - importablePayloads.length,
    }
  }

  private async getFilePassword(): Promise<Result<string>> {
    const challenge = new Challenge(
      [new ChallengePrompt(ChallengeValidation.None, Strings.FileAccountPassword, undefined, true)],
      ChallengeReason.DecryptEncryptedFile,
      true,
    )
    const passwordResponse = await this.challengeService.promptForChallengeResponse(challenge)
    if (passwordResponse == undefined) {
      /** Challenge was canceled */
      return Result.fail('Import aborted')
    }
    this.challengeService.completeChallenge(challenge)
    return Result.ok(passwordResponse?.values[0].value as string)
  }

  /**
   * Prior to 003 backup files did not have a version field so we cannot
   * stop importing if there is no backup file version, only if there is
   * an unsupported version.
   */
  private validateVersion(version: ProtocolVersion): Result<void> {
    const supportedVersions = this.encryption.supportedVersions()
    if (!supportedVersions.includes(version)) {
      return Result.fail(Strings.UnsupportedBackupFileVersion)
    }

    const userVersion = this.encryption.getUserVersion()
    if (userVersion && compareVersions(version, userVersion) === 1) {
      /** File was made with a greater version than the user's account */
      return Result.fail(Strings.BackupFileMoreRecentThanAccount)
    }

    return Result.ok()
  }
}

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
  ComponentContent,
  CopyPayloadWithContentOverride,
  CreateDecryptedBackupFileContextPayload,
  CreateEncryptedBackupFileContextPayload,
  DecryptedItemInterface,
  DecryptedPayloadInterface,
  isDecryptedPayload,
  isEncryptedTransferPayload,
} from '@standardnotes/models'
import { ClientDisplayableError } from '@standardnotes/responses'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { Challenge, ChallengePrompt, ChallengeReason, ChallengeValidation } from '../Challenge'
import { ContentType } from '@standardnotes/domain-core'

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
    private syncService: SyncServiceInterface,
    private protectionService: ProtectionsClientInterface,
    private encryption: EncryptionProviderInterface,
    private payloadManager: PayloadManagerInterface,
    private challengeService: ChallengeServiceInterface,
    private historyService: HistoryServiceInterface,
  ) {}

  /**
   * @returns
   * .affectedItems: Items that were either created or dirtied by this import
   * .errorCount: The number of items that were not imported due to failure to decrypt.
   */

  async execute(data: BackupFile, awaitSync = false): Promise<ImportDataReturnType> {
    if (data.version) {
      /**
       * Prior to 003 backup files did not have a version field so we cannot
       * stop importing if there is no backup file version, only if there is
       * an unsupported version.
       */
      const version = data.version as ProtocolVersion

      const supportedVersions = this.encryption.supportedVersions()
      if (!supportedVersions.includes(version)) {
        return { error: new ClientDisplayableError(Strings.UnsupportedBackupFileVersion) }
      }

      const userVersion = this.encryption.getUserVersion()
      if (userVersion && compareVersions(version, userVersion) === 1) {
        /** File was made with a greater version than the user's account */
        return { error: new ClientDisplayableError(Strings.BackupFileMoreRecentThanAccount) }
      }
    }

    let password: string | undefined

    if (data.auth_params || data.keyParams) {
      /** Get import file password. */
      const challenge = new Challenge(
        [new ChallengePrompt(ChallengeValidation.None, Strings.FileAccountPassword, undefined, true)],
        ChallengeReason.DecryptEncryptedFile,
        true,
      )
      const passwordResponse = await this.challengeService.promptForChallengeResponse(challenge)
      if (passwordResponse == undefined) {
        /** Challenge was canceled */
        return { error: new ClientDisplayableError('Import aborted') }
      }
      this.challengeService.completeChallenge(challenge)
      password = passwordResponse?.values[0].value as string
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

    const decryptedPayloadsOrError = await this.encryption.decryptBackupFile(data, password)

    if (decryptedPayloadsOrError instanceof ClientDisplayableError) {
      return { error: decryptedPayloadsOrError }
    }

    const validPayloads = decryptedPayloadsOrError.filter(isDecryptedPayload).map((payload) => {
      /* Don't want to activate any components during import process in
       * case of exceptions breaking up the import proccess */
      if (payload.content_type === ContentType.TYPES.Component && (payload.content as ComponentContent).active) {
        const typedContent = payload as DecryptedPayloadInterface<ComponentContent>
        return CopyPayloadWithContentOverride(typedContent, {
          active: false,
        })
      } else {
        return payload
      }
    })

    const affectedUuids = await this.payloadManager.importPayloads(
      validPayloads,
      this.historyService.getHistoryMapCopy(),
    )

    const promise = this.syncService.sync()

    if (awaitSync) {
      await promise
    }

    const affectedItems = this.itemManager.findItems(affectedUuids) as DecryptedItemInterface[]

    return {
      affectedItems: affectedItems,
      errorCount: decryptedPayloadsOrError.length - validPayloads.length,
    }
  }
}

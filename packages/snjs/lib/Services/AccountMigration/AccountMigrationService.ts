import { ClientDisplayableError, isErrorResponse } from '@standardnotes/responses'
import { UuidGenerator } from '@standardnotes/utils'
import { SNApplication, SyncEvent } from '@Lib/Application'
import { LoggingDomain, log } from '@Lib/Logging'
import { FileItem, PayloadEmitSource, PayloadsByDuplicating } from '@standardnotes/models'
import { ApplicationEvent } from '@standardnotes/services'
import { ContentType } from '@standardnotes/common'
import { FileDownloader, FileUploader } from '@standardnotes/files'

export enum AccountMigrationStage {
  Preparing = 'preparing',
  SigningIn = 'signing-in',
  DownloadingAccountData = 'downloading-account-data',
  ImportingAccountData = 'importing-account-data',
  DownloadingFileData = 'downloading-file-data',
  ImportingFileData = 'importing-file-data',
  FinishedSuccess = 'finished-success',
  FinishedError = 'finished-error',
}

export class AccountMigrationService {
  constructor(
    private applicationImportingTo: SNApplication,
    private onStatus: (status: string, stage?: AccountMigrationStage) => void,
  ) {}

  deinit() {
    ;(this.applicationImportingTo as unknown) = undefined
  }

  async importAccount(email: string, password: string, server: string) {
    log(LoggingDomain.AccountMigration, 'Importing account')
    const identifier = UuidGenerator.GenerateUuid()
    const device = this.applicationImportingTo.deviceInterface

    const tempApp = new SNApplication({
      environment: this.applicationImportingTo.environment,
      platform: this.applicationImportingTo.platform,
      deviceInterface: this.applicationImportingTo.deviceInterface,
      crypto: this.applicationImportingTo.options.crypto,
      alertService: this.applicationImportingTo.alertService,
      identifier: identifier,
      defaultHost: server,
      appVersion: this.applicationImportingTo.options.appVersion,
    })

    tempApp.addEventObserver(async (eventName: ApplicationEvent) => {
      this.handleTempApplicationEvent(tempApp, eventName)
    })

    device.setApplication(tempApp)

    this.onStatus('Preparing...', AccountMigrationStage.Preparing)

    log(LoggingDomain.AccountMigration, 'Preparing for launch')
    await tempApp.prepareForLaunch({
      receiveChallenge: this.applicationImportingTo.challengeService.sendChallenge,
    })
    log(LoggingDomain.AccountMigration, 'Launching')
    await tempApp.launch()

    this.onStatus('Signing in...', AccountMigrationStage.SigningIn)

    log(LoggingDomain.AccountMigration, 'Signing in...')
    await tempApp.signIn(email, password, false, true, false, false)
    log(LoggingDomain.AccountMigration, 'Completed sign-in')

    this.onStatus('Downloading notes and tags data...', AccountMigrationStage.DownloadingAccountData)

    await this.awaitFullSync(tempApp)

    const items = tempApp.items.items
    log(LoggingDomain.AccountMigration, `Importing ${items.length} items`)

    this.onStatus(`Importing ${items.length} items...`, AccountMigrationStage.ImportingAccountData)

    for (const item of items) {
      const payload = item.payload.copy()
      const resultingPayloads = PayloadsByDuplicating({
        payload,
        baseCollection: tempApp.payloadManager.getMasterCollection(),
        isConflict: false,
      })

      await this.applicationImportingTo.payloadManager.emitPayloads(resultingPayloads, PayloadEmitSource.LocalChanged)
    }

    this.onStatus('Migrating files...', AccountMigrationStage.DownloadingFileData)

    const files = this.applicationImportingTo.items.getItems<FileItem>(ContentType.File)

    for (const file of files) {
      this.onStatus(`Migrating ${file.name}...`)
      const api = this.applicationImportingTo.apiService
      const valetToken = await api.createFileValetToken(file.remoteIdentifier, 'write', file.decryptedSize)
      log(LoggingDomain.AccountMigration, `Created file valet token for ${file.uuid} token ${valetToken}`)

      if (valetToken instanceof ClientDisplayableError) {
        log(LoggingDomain.AccountMigration, `Failed to create file valet token for ${file.uuid}`)
        continue
      }

      const uploadSessionStarted = await api.startUploadSession(valetToken)
      if (isErrorResponse(uploadSessionStarted) || !uploadSessionStarted.data.uploadId) {
        log(LoggingDomain.AccountMigration, 'Could not start upload session')
        return new ClientDisplayableError('Could not start upload session')
      }

      log(LoggingDomain.AccountMigration, 'Started upload session', uploadSessionStarted.data.uploadId)

      const uploader = new FileUploader(api)
      let chunkIndex = 1

      const matchingFileForTempApp = tempApp.items
        .getItems<FileItem>(ContentType.File)
        .find((f) => f.remoteIdentifier === file.remoteIdentifier)

      if (!matchingFileForTempApp) {
        log(LoggingDomain.AccountMigration, 'Could not find file for temp app')
        continue
      }

      const downloader = new FileDownloader(matchingFileForTempApp!, tempApp.apiService)

      const downloadResult = await downloader.run(async (encryptedBytes, progress) => {
        log(LoggingDomain.AccountMigration, 'Downloaded bytes', encryptedBytes.length, 'progress', progress)
        const success = await uploader.uploadBytes(encryptedBytes, chunkIndex, valetToken)
        log(LoggingDomain.AccountMigration, 'Uploaded bytes success', success)

        chunkIndex++
      })

      const success = downloadResult instanceof ClientDisplayableError ? false : true
      if (!success) {
        log(LoggingDomain.AccountMigration, 'Could not download file', downloadResult)
        return new ClientDisplayableError('Could not download file')
      }

      const uploadSessionClosed = await api.closeUploadSession(valetToken)

      if (!uploadSessionClosed) {
        log(LoggingDomain.AccountMigration, 'Could not close upload session')
        return new ClientDisplayableError('Could not close upload session')
      }
    }

    this.onStatus('Migration completed successfully.', AccountMigrationStage.FinishedSuccess)

    log(LoggingDomain.AccountMigration, 'Finished importing items')

    device.removeApplication(tempApp)
  }

  awaitFullSync(tempApp: SNApplication) {
    return new Promise((resolve) => {
      const removeObserver = tempApp.sync.addEventObserver((event) => {
        if (event === SyncEvent.SyncCompletedWithAllItemsUploadedAndDownloaded) {
          removeObserver()
          resolve(true)
        }
      })
    })
  }

  handleTempApplicationEvent(tempApp: SNApplication, eventName: ApplicationEvent) {
    switch (eventName) {
      case ApplicationEvent.EnteredOutOfSync:
      case ApplicationEvent.ExitedOutOfSync:
      case ApplicationEvent.CompletedFullSync:
      case ApplicationEvent.SyncStatusChanged:
      case ApplicationEvent.FailedSync:
      case ApplicationEvent.WillSync: {
        const status = this.getSyncStatus(tempApp)
        if (status) {
          this.onStatus(status)
        }
        break
      }
    }
  }

  getSyncStatus(tempApp: SNApplication): string | undefined {
    const syncStatus = tempApp.sync.getSyncStatus()
    const stats = syncStatus.getStats()
    if (syncStatus.hasError()) {
      return 'Unable to Sync'
    } else if (stats.downloadCount > 20) {
      const text = `Downloading ${stats.downloadCount} items...`
      return text
    } else {
      return undefined
    }
  }
}

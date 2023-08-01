import { EncryptionProviderInterface } from './../Encryption/EncryptionProviderInterface'
import { LegacyApiServiceInterface } from './../Api/LegacyApiServiceInterface'
import { PureCryptoInterface, StreamEncryptor } from '@standardnotes/sncrypto-common'
import { FileItem } from '@standardnotes/models'
import { ItemManagerInterface } from '../Item/ItemManagerInterface'
import { ChallengeServiceInterface } from '../Challenge'
import { InternalEventBusInterface, MutatorClientInterface } from '..'
import { AlertService } from '../Alert/AlertService'

import { SyncServiceInterface } from '../Sync/SyncServiceInterface'
import { FileService } from './FileService'
import { BackupServiceInterface } from '@standardnotes/files'
import { HttpServiceInterface } from '@standardnotes/api'
import { LoggerInterface } from '@standardnotes/utils'

describe('fileService', () => {
  let apiService: LegacyApiServiceInterface
  let itemManager: ItemManagerInterface
  let mutator: MutatorClientInterface
  let syncService: SyncServiceInterface
  let alertService: AlertService
  let crypto: PureCryptoInterface
  let challengor: ChallengeServiceInterface
  let fileService: FileService
  let encryptor: EncryptionProviderInterface
  let internalEventBus: InternalEventBusInterface
  let backupService: BackupServiceInterface
  let http: HttpServiceInterface

  let logger: LoggerInterface

  beforeEach(() => {
    apiService = {} as jest.Mocked<LegacyApiServiceInterface>
    apiService.addEventObserver = jest.fn()
    apiService.createUserFileValetToken = jest.fn()
    apiService.deleteFile = jest.fn().mockReturnValue({})
    const numChunks = 1
    apiService.downloadFile = jest
      .fn()
      .mockImplementation(
        (params: {
          _file: string
          _chunkIndex: number
          _apiToken: string
          _ownershipType: string
          _rangeStart: number
          onBytesReceived: (bytes: Uint8Array) => void
        }) => {
          return new Promise<void>((resolve) => {
            for (let i = 0; i < numChunks; i++) {
              params.onBytesReceived(Uint8Array.from([0xaa]))
            }

            resolve()
          })
        },
      )

    itemManager = {} as jest.Mocked<ItemManagerInterface>
    itemManager.createTemplateItem = jest.fn().mockReturnValue({})
    itemManager.addObserver = jest.fn()

    mutator = {} as jest.Mocked<MutatorClientInterface>
    mutator.createItem = jest.fn()
    mutator.setItemToBeDeleted = jest.fn()
    mutator.changeItem = jest.fn()

    challengor = {} as jest.Mocked<ChallengeServiceInterface>

    syncService = {} as jest.Mocked<SyncServiceInterface>
    syncService.sync = jest.fn()

    encryptor = {} as jest.Mocked<EncryptionProviderInterface>

    alertService = {} as jest.Mocked<AlertService>
    alertService.confirm = jest.fn().mockReturnValue(true)
    alertService.alert = jest.fn()

    crypto = {} as jest.Mocked<PureCryptoInterface>
    crypto.base64Decode = jest.fn()
    internalEventBus = {} as jest.Mocked<InternalEventBusInterface>
    internalEventBus.publish = jest.fn()

    backupService = {} as jest.Mocked<BackupServiceInterface>
    backupService.readEncryptedFileFromBackup = jest.fn()
    backupService.getFileBackupInfo = jest.fn()

    logger = {} as jest.Mocked<LoggerInterface>
    logger.info = jest.fn()

    http = {} as jest.Mocked<HttpServiceInterface>

    fileService = new FileService(
      apiService,
      mutator,
      syncService,
      encryptor,
      challengor,
      http,
      alertService,
      crypto,
      internalEventBus,
      logger,
      backupService,
    )

    crypto.xchacha20StreamInitDecryptor = jest.fn().mockReturnValue({
      state: {},
    } as StreamEncryptor)

    crypto.xchacha20StreamDecryptorPush = jest.fn().mockReturnValue({ message: new Uint8Array([0xaa]), tag: 0 })

    crypto.xchacha20StreamInitEncryptor = jest.fn().mockReturnValue({
      header: 'some-header',
      state: {},
    } as StreamEncryptor)

    crypto.xchacha20StreamEncryptorPush = jest.fn().mockReturnValue(new Uint8Array())
  })

  it('should cache file after download', async () => {
    const file = {
      uuid: '1',
      decryptedSize: 100_000,
      encryptedSize: 101_000,
      encryptedChunkSizes: [101_000],
    } as jest.Mocked<FileItem>

    let downloadMock = apiService.downloadFile as jest.Mock

    await fileService.downloadFile(file, async () => {
      return Promise.resolve()
    })

    expect(downloadMock).toHaveBeenCalledTimes(1)

    downloadMock = apiService.downloadFile = jest.fn()

    await fileService.downloadFile(file, async () => {
      return Promise.resolve()
    })

    expect(downloadMock).toHaveBeenCalledTimes(0)

    expect(fileService['encryptedCache'].get(file.uuid)).toBeTruthy()
  })

  it('deleting file should remove it from cache', async () => {
    const file = {
      uuid: '1',
      decryptedSize: 100_000,
    } as jest.Mocked<FileItem>

    apiService.downloadFile = jest.fn()

    await fileService.downloadFile(file, async () => {
      return Promise.resolve()
    })

    await fileService.deleteFile(file)

    expect(fileService['encryptedCache'].get(file.uuid)).toBeFalsy()
  })

  it('if file fails to delete, should present alert asking if they want to remove item', async () => {
    const file = {
      uuid: '1',
      decryptedSize: 100_000,
    } as jest.Mocked<FileItem>

    const alertMock = (alertService.confirm = jest.fn().mockReturnValue(true))
    const deleteItemMock = (mutator.setItemToBeDeleted = jest.fn())

    apiService.deleteFile = jest.fn().mockReturnValue({ data: { error: true } })

    await fileService.deleteFile(file)

    expect(alertMock).toHaveBeenCalledTimes(1)
    expect(deleteItemMock).toHaveBeenCalledTimes(1)
  })

  it('should download file from network if no backup', async () => {
    const file = {
      uuid: '1',
      decryptedSize: 100_000,
      encryptedSize: 101_000,
      encryptedChunkSizes: [101_000],
    } as jest.Mocked<FileItem>

    backupService.getFileBackupInfo = jest.fn().mockReturnValue(undefined)

    const downloadMock = apiService.downloadFile as jest.Mock

    await fileService.downloadFile(file, async () => {
      return Promise.resolve()
    })

    expect(downloadMock).toHaveBeenCalledTimes(1)
  })

  it('should download file from local backup if it exists', async () => {
    const file = {
      uuid: '1',
      decryptedSize: 100_000,
      encryptedSize: 101_000,
      encryptedChunkSizes: [101_000],
    } as jest.Mocked<FileItem>

    backupService.getFileBackupInfo = jest.fn().mockReturnValue({})

    const downloadMock = (apiService.downloadFile = jest.fn())

    await fileService.downloadFile(file, async () => {
      return Promise.resolve()
    })

    expect(downloadMock).toHaveBeenCalledTimes(0)
  })
})

import { StatusServiceInterface } from './../Status/StatusServiceInterface'
import { FilesBackupService } from './BackupService'
import { PureCryptoInterface, StreamEncryptor } from '@standardnotes/sncrypto-common'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { ItemManagerInterface } from '../Item/ItemManagerInterface'
import { InternalEventBusInterface } from '..'
import { AlertService } from '../Alert/AlertService'
import { ApiServiceInterface } from '../Api/ApiServiceInterface'
import { SyncServiceInterface } from '../Sync/SyncServiceInterface'
import { FileBackupsDevice } from '@standardnotes/files'

describe('backup service', () => {
  let apiService: ApiServiceInterface
  let itemManager: ItemManagerInterface
  let syncService: SyncServiceInterface
  let alertService: AlertService
  let crypto: PureCryptoInterface
  let status: StatusServiceInterface
  let encryptor: EncryptionProviderInterface
  let internalEventBus: InternalEventBusInterface
  let backupService: FilesBackupService
  let device: FileBackupsDevice

  beforeEach(() => {
    apiService = {} as jest.Mocked<ApiServiceInterface>
    apiService.addEventObserver = jest.fn()
    apiService.createFileValetToken = jest.fn()
    apiService.downloadFile = jest.fn()
    apiService.deleteFile = jest.fn().mockReturnValue({})

    itemManager = {} as jest.Mocked<ItemManagerInterface>
    itemManager.createItem = jest.fn()
    itemManager.createTemplateItem = jest.fn().mockReturnValue({})
    itemManager.setItemToBeDeleted = jest.fn()
    itemManager.addObserver = jest.fn()
    itemManager.changeItem = jest.fn()

    status = {} as jest.Mocked<StatusServiceInterface>
    device = {} as jest.Mocked<FileBackupsDevice>

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

    backupService = new FilesBackupService(itemManager, apiService, encryptor, device, status, crypto, internalEventBus)

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

  describe('readEncryptedFileFromBackup', () => {
    it('return failed if no backup', async () => {
      backupService.getFileBackupInfo = jest.fn().mockReturnValue(undefined)

      const result = await backupService.readEncryptedFileFromBackup('123', async () => {})

      expect(result).toEqual('failed')
    })
  })
})

import { DecryptedBytes, EncryptedBytes, FileMemoryCache, OrderedByteChunker } from '@standardnotes/filepicker'
import { ClientDisplayableError } from '@standardnotes/responses'
import { ContentType } from '@standardnotes/common'
import {
  FileItem,
  FileProtocolV1Constants,
  FileMetadata,
  FileContentSpecialized,
  FillItemContentSpecialized,
  FileContent,
  EncryptedPayload,
  isEncryptedPayload,
} from '@standardnotes/models'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { UuidGenerator } from '@standardnotes/utils'
import {
  AbstractService,
  InternalEventBusInterface,
  ItemManagerInterface,
  SyncServiceInterface,
  AlertService,
  FileSystemApi,
  FilesApiInterface,
  FileBackupMetadataFile,
  FileHandleRead,
  FileSystemNoSelection,
  ChallengeServiceInterface,
  FileBackupsConstantsV1,
} from '@standardnotes/services'
import { DecryptItemsKeyWithUserFallback, EncryptionProvider, SNItemsKey } from '@standardnotes/encryption'
import {
  DownloadAndDecryptFileOperation,
  EncryptAndUploadFileOperation,
  FileDecryptor,
  FileDownloadProgress,
  FilesClientInterface,
  readAndDecryptBackupFile,
} from '@standardnotes/files'

const OneHundredMb = 100 * 1_000_000

export class FileService extends AbstractService implements FilesClientInterface {
  private encryptedCache: FileMemoryCache = new FileMemoryCache(OneHundredMb)

  constructor(
    private api: FilesApiInterface,
    private itemManager: ItemManagerInterface,
    private syncService: SyncServiceInterface,
    private encryptor: EncryptionProvider,
    private challengor: ChallengeServiceInterface,
    private alertService: AlertService,
    private crypto: PureCryptoInterface,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)
  }

  override deinit(): void {
    super.deinit()

    this.encryptedCache.clear()
    ;(this.encryptedCache as unknown) = undefined
    ;(this.api as unknown) = undefined
    ;(this.itemManager as unknown) = undefined
    ;(this.encryptor as unknown) = undefined
    ;(this.syncService as unknown) = undefined
    ;(this.alertService as unknown) = undefined
    ;(this.challengor as unknown) = undefined
    ;(this.crypto as unknown) = undefined
  }

  public minimumChunkSize(): number {
    return 5_000_000
  }

  public async beginNewFileUpload(
    sizeInBytes: number,
  ): Promise<EncryptAndUploadFileOperation | ClientDisplayableError> {
    const remoteIdentifier = UuidGenerator.GenerateUuid()
    const tokenResult = await this.api.createFileValetToken(remoteIdentifier, 'write', sizeInBytes)

    if (tokenResult instanceof ClientDisplayableError) {
      return tokenResult
    }

    const key = this.crypto.generateRandomKey(FileProtocolV1Constants.KeySize)

    const fileParams = {
      key,
      remoteIdentifier,
      decryptedSize: sizeInBytes,
    }

    const uploadOperation = new EncryptAndUploadFileOperation(fileParams, tokenResult, this.crypto, this.api)

    const uploadSessionStarted = await this.api.startUploadSession(tokenResult)

    if (!uploadSessionStarted.uploadId) {
      return new ClientDisplayableError('Could not start upload session')
    }

    return uploadOperation
  }

  public async pushBytesForUpload(
    operation: EncryptAndUploadFileOperation,
    bytes: Uint8Array,
    chunkId: number,
    isFinalChunk: boolean,
  ): Promise<ClientDisplayableError | undefined> {
    const success = await operation.pushBytes(bytes, chunkId, isFinalChunk)

    if (!success) {
      return new ClientDisplayableError('Failed to push file bytes to server')
    }

    return undefined
  }

  public async finishUpload(
    operation: EncryptAndUploadFileOperation,
    fileMetadata: FileMetadata,
  ): Promise<FileItem | ClientDisplayableError> {
    const uploadSessionClosed = await this.api.closeUploadSession(operation.getApiToken())

    if (!uploadSessionClosed) {
      return new ClientDisplayableError('Could not close upload session')
    }

    const result = operation.getResult()

    const fileContent: FileContentSpecialized = {
      decryptedSize: result.finalDecryptedSize,
      encryptedChunkSizes: operation.encryptedChunkSizes,
      encryptionHeader: result.encryptionHeader,
      key: result.key,
      mimeType: fileMetadata.mimeType,
      name: fileMetadata.name,
      remoteIdentifier: result.remoteIdentifier,
    }

    const file = await this.itemManager.createItem<FileItem>(
      ContentType.File,
      FillItemContentSpecialized(fileContent),
      true,
    )

    await this.syncService.sync()

    return file
  }

  private async decryptCachedEntry(file: FileItem, entry: EncryptedBytes): Promise<DecryptedBytes> {
    const decryptOperation = new FileDecryptor(file, this.crypto)

    let decryptedAggregate = new Uint8Array()

    const orderedChunker = new OrderedByteChunker(file.encryptedChunkSizes, async (encryptedBytes) => {
      const decryptedBytes = decryptOperation.decryptBytes(encryptedBytes)

      if (decryptedBytes) {
        decryptedAggregate = new Uint8Array([...decryptedAggregate, ...decryptedBytes.decryptedBytes])
      }
    })

    await orderedChunker.addBytes(entry.encryptedBytes)

    return { decryptedBytes: decryptedAggregate }
  }

  public async downloadFile(
    file: FileItem,
    onDecryptedBytes: (decryptedBytes: Uint8Array, progress?: FileDownloadProgress) => Promise<void>,
  ): Promise<ClientDisplayableError | undefined> {
    const cachedBytes = this.encryptedCache.get(file.uuid)

    if (cachedBytes) {
      const decryptedBytes = await this.decryptCachedEntry(file, cachedBytes)

      await onDecryptedBytes(decryptedBytes.decryptedBytes, undefined)

      return undefined
    }

    const addToCache = file.encryptedSize < this.encryptedCache.maxSize

    let cacheEntryAggregate = new Uint8Array()

    const operation = new DownloadAndDecryptFileOperation(file, this.crypto, this.api)

    const result = await operation.run(async ({ decrypted, encrypted, progress }): Promise<void> => {
      if (addToCache) {
        cacheEntryAggregate = new Uint8Array([...cacheEntryAggregate, ...encrypted.encryptedBytes])
      }
      return onDecryptedBytes(decrypted.decryptedBytes, progress)
    })

    if (addToCache) {
      this.encryptedCache.add(file.uuid, { encryptedBytes: cacheEntryAggregate })
    }

    return result.error
  }

  public async deleteFile(file: FileItem): Promise<ClientDisplayableError | undefined> {
    this.encryptedCache.remove(file.uuid)

    const tokenResult = await this.api.createFileValetToken(file.remoteIdentifier, 'delete')

    if (tokenResult instanceof ClientDisplayableError) {
      return tokenResult
    }

    const result = await this.api.deleteFile(tokenResult)

    if (result.error) {
      return ClientDisplayableError.FromError(result.error)
    }

    await this.itemManager.setItemToBeDeleted(file)
    await this.syncService.sync()

    return undefined
  }

  public isFileNameFileBackupRelated(name: string): 'metadata' | 'binary' | false {
    if (name === FileBackupsConstantsV1.MetadataFileName) {
      return 'metadata'
    } else if (name === FileBackupsConstantsV1.BinaryFileName) {
      return 'binary'
    }

    return false
  }

  public async decryptBackupMetadataFile(metdataFile: FileBackupMetadataFile): Promise<FileItem | undefined> {
    const encryptedItemsKey = new EncryptedPayload({
      ...metdataFile.itemsKey,
      waitingForKey: false,
      errorDecrypting: false,
    })

    const decryptedItemsKeyResult = await DecryptItemsKeyWithUserFallback(
      encryptedItemsKey,
      this.encryptor,
      this.challengor,
    )

    if (decryptedItemsKeyResult === 'failed' || decryptedItemsKeyResult === 'aborted') {
      return undefined
    }

    const encryptedFile = new EncryptedPayload({ ...metdataFile.file, waitingForKey: false, errorDecrypting: false })

    const itemsKey = new SNItemsKey(decryptedItemsKeyResult)

    const decryptedFile = await this.encryptor.decryptSplitSingle<FileContent>({
      usesItemsKey: {
        items: [encryptedFile],
        key: itemsKey,
      },
    })

    if (isEncryptedPayload(decryptedFile)) {
      return undefined
    }

    return new FileItem(decryptedFile)
  }

  public async selectFile(fileSystem: FileSystemApi): Promise<FileHandleRead | FileSystemNoSelection> {
    const result = await fileSystem.selectFile()

    return result
  }

  public async readBackupFileAndSaveDecrypted(
    fileHandle: FileHandleRead,
    file: FileItem,
    fileSystem: FileSystemApi,
  ): Promise<'success' | 'aborted' | 'failed'> {
    const destinationDirectoryHandle = await fileSystem.selectDirectory()

    if (destinationDirectoryHandle === 'aborted' || destinationDirectoryHandle === 'failed') {
      return destinationDirectoryHandle
    }

    const destinationFileHandle = await fileSystem.createFile(destinationDirectoryHandle, file.name)

    if (destinationFileHandle === 'aborted' || destinationFileHandle === 'failed') {
      return destinationFileHandle
    }

    const result = await readAndDecryptBackupFile(fileHandle, file, fileSystem, this.crypto, async (decryptedBytes) => {
      await fileSystem.saveBytes(destinationFileHandle, decryptedBytes)
    })

    await fileSystem.closeFileWriteStream(destinationFileHandle)

    return result
  }

  public async readBackupFileBytesDecrypted(
    fileHandle: FileHandleRead,
    file: FileItem,
    fileSystem: FileSystemApi,
  ): Promise<Uint8Array> {
    let bytes = new Uint8Array()

    await readAndDecryptBackupFile(fileHandle, file, fileSystem, this.crypto, async (decryptedBytes) => {
      bytes = new Uint8Array([...bytes, ...decryptedBytes])
    })

    return bytes
  }
}

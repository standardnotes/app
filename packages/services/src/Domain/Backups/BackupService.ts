import { ContentType } from '@standardnotes/common'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import {
  PayloadEmitSource,
  FileItem,
  CreateEncryptedBackupFileContextPayload,
  SNNote,
  SNTag,
} from '@standardnotes/models'
import { ClientDisplayableError } from '@standardnotes/responses'
import {
  FilesApiInterface,
  FileBackupMetadataFile,
  FileBackupsDevice,
  FileBackupsMapping,
  FileBackupRecord,
  OnChunkCallback,
  BackupServiceInterface,
} from '@standardnotes/files'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { ItemManagerInterface } from '../Item/ItemManagerInterface'
import { AbstractService } from '../Service/AbstractService'
import { StatusServiceInterface } from '../Status/StatusServiceInterface'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { StorageServiceInterface } from '../Storage/StorageServiceInterface'
import { StorageKey } from '../Storage/StorageKeys'

const PlaintextBackupsDirectoryName = 'Plaintext Backups'
const TextBackupsDirectoryName = 'Text Backups'
const FileBackupsDirectoryName = 'File Backups'

export class FilesBackupService extends AbstractService implements BackupServiceInterface {
  private filesObserverDisposer: () => void
  private notesObserverDisposer: () => void
  private tagsObserverDisposer: () => void

  private pendingFiles = new Set<string>()
  private mappingCache?: FileBackupsMapping['files']

  constructor(
    private items: ItemManagerInterface,
    private api: FilesApiInterface,
    private encryptor: EncryptionProviderInterface,
    private device: FileBackupsDevice,
    private status: StatusServiceInterface,
    private crypto: PureCryptoInterface,
    private storage: StorageServiceInterface,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)

    this.filesObserverDisposer = items.addObserver<FileItem>(ContentType.File, ({ changed, inserted, source }) => {
      const applicableSources = [
        PayloadEmitSource.LocalDatabaseLoaded,
        PayloadEmitSource.RemoteSaved,
        PayloadEmitSource.RemoteRetrieved,
      ]
      if (applicableSources.includes(source)) {
        void this.handleChangedFiles([...changed, ...inserted])
      }
    })

    this.notesObserverDisposer = items.addObserver<SNNote>(ContentType.Note, ({ changed, inserted, source }) => {
      if ([PayloadEmitSource.RemoteSaved, PayloadEmitSource.RemoteRetrieved].includes(source)) {
        void this.handleChangedNotes([...changed, ...inserted])
      }
    })

    this.tagsObserverDisposer = items.addObserver<SNTag>(ContentType.Tag, ({ changed, inserted, source }) => {
      if ([PayloadEmitSource.RemoteSaved, PayloadEmitSource.RemoteRetrieved].includes(source)) {
        void this.handleChangedTags([...changed, ...inserted])
      }
    })
  }

  override deinit() {
    super.deinit()
    this.filesObserverDisposer()
    this.notesObserverDisposer()
    this.tagsObserverDisposer()
    ;(this.items as unknown) = undefined
    ;(this.api as unknown) = undefined
    ;(this.encryptor as unknown) = undefined
    ;(this.device as unknown) = undefined
    ;(this.status as unknown) = undefined
    ;(this.crypto as unknown) = undefined
    ;(this.storage as unknown) = undefined
  }

  openAllDirectoriesContainingBackupFiles(): void {
    const fileBackupsLocation = this.getFilesBackupsLocation()
    const plaintextBackupsLocation = this.getPlaintextBackupsLocation()
    const textBackupsLocation = this.getTextBackupsLocation()

    if (fileBackupsLocation) {
      void this.device.openLocation(fileBackupsLocation)
    }

    if (plaintextBackupsLocation) {
      void this.device.openLocation(plaintextBackupsLocation)
    }

    if (textBackupsLocation) {
      void this.device.openLocation(textBackupsLocation)
    }
  }

  isFilesBackupsEnabled(): boolean {
    return this.storage.getValue(StorageKey.FileBackupsEnabled, false)
  }

  getFilesBackupsLocation(): string | undefined {
    return this.storage.getValue(StorageKey.FileBackupsLocation)
  }

  isTextBackupsEnabled(): boolean {
    return this.storage.getValue(StorageKey.TextBackupsEnabled, true)
  }

  enableTextBackups(): void {
    this.storage.setValue(StorageKey.TextBackupsEnabled, true)
  }

  disableTextBackups(): void {
    this.storage.setValue(StorageKey.TextBackupsEnabled, false)
  }

  getTextBackupsLocation(): string | undefined {
    return this.storage.getValue(StorageKey.TextBackupsLocation)
  }

  async openTextBackupsLocation(): Promise<void> {
    const location = this.getTextBackupsLocation()
    if (location) {
      void this.device.openLocation(location)
    }
  }

  async changeTextBackupsLocation(): Promise<string | undefined> {
    const oldLocation = this.getTextBackupsLocation()
    const newLocation = await this.device.presentDirectoryPickerForLocationChangeAndTransferOld(
      TextBackupsDirectoryName,
      oldLocation,
    )

    if (!newLocation) {
      return undefined
    }

    this.storage.setValue(StorageKey.TextBackupsLocation, newLocation)

    return newLocation
  }

  isPlaintextBackupsEnabled(): boolean {
    return this.storage.getValue(StorageKey.PlaintextBackupsEnabled, false)
  }

  async disablePlaintextBackups(): Promise<void> {
    this.storage.setValue(StorageKey.PlaintextBackupsEnabled, false)
  }

  getPlaintextBackupsLocation(): string | undefined {
    return this.storage.getValue(StorageKey.PlaintextBackupsLocation)
  }

  async openPlaintextBackupsLocation(): Promise<void> {
    const location = this.getPlaintextBackupsLocation()
    if (location) {
      void this.device.openLocation(location)
    }
  }

  async changePlaintextBackupsLocation(): Promise<string | undefined> {
    const oldLocation = this.getPlaintextBackupsLocation()
    const newLocation = this.device.presentDirectoryPickerForLocationChangeAndTransferOld(
      PlaintextBackupsDirectoryName,
      oldLocation,
    )

    if (!newLocation) {
      return undefined
    }

    this.storage.setValue(StorageKey.PlaintextBackupsLocation, newLocation)

    return newLocation
  }

  public async enableFilesBackups(): Promise<void> {
    const directory = await this.device.presentDirectoryPickerForLocationChangeAndTransferOld(FileBackupsDirectoryName)
    if (!directory) {
      return
    }

    this.storage.setValue(StorageKey.FileBackupsEnabled, true)
    this.storage.setValue(StorageKey.FileBackupsLocation, directory)

    this.backupAllFiles()
  }

  public async enablePlaintextBackups(): Promise<void> {
    const directory = await this.device.presentDirectoryPickerForLocationChangeAndTransferOld(
      PlaintextBackupsDirectoryName,
    )
    if (!directory) {
      return
    }

    this.storage.setValue(StorageKey.PlaintextBackupsEnabled, true)
    this.storage.setValue(StorageKey.PlaintextBackupsLocation, directory)

    await this.handleChangedNotes(this.items.getItems<SNNote>(ContentType.Note))
  }

  private backupAllFiles(): void {
    const files = this.items.getItems<FileItem>(ContentType.File)

    void this.handleChangedFiles(files)
  }

  public async disableFilesBackups(): Promise<void> {
    this.storage.setValue(StorageKey.FileBackupsEnabled, false)
  }

  public async changeFilesBackupsLocation(): Promise<string | undefined> {
    const oldLocation = this.getFilesBackupsLocation()
    const newLocation = await this.device.presentDirectoryPickerForLocationChangeAndTransferOld(
      FileBackupsDirectoryName,
      oldLocation,
    )
    if (!newLocation) {
      return undefined
    }

    this.storage.setValue(StorageKey.FileBackupsLocation, newLocation)

    return newLocation
  }

  public async openFilesBackupsLocation(): Promise<void> {
    const location = this.getFilesBackupsLocation()
    if (location) {
      void this.device.openLocation(location)
    }
  }

  private async getBackupsMappingFromDisk(): Promise<FileBackupsMapping['files'] | undefined> {
    const location = this.getFilesBackupsLocation()
    if (!location) {
      return undefined
    }

    const result = (await this.device.getFilesBackupsMappingFile(location)).files

    this.mappingCache = result

    return result
  }

  private invalidateMappingCache(): void {
    this.mappingCache = undefined
  }

  private async getBackupsMappingFromCache(): Promise<FileBackupsMapping['files'] | undefined> {
    return this.mappingCache ?? (await this.getBackupsMappingFromDisk())
  }

  public async getFileBackupInfo(file: { uuid: string }): Promise<FileBackupRecord | undefined> {
    const mapping = await this.getBackupsMappingFromCache()
    if (!mapping) {
      return undefined
    }

    const record = mapping[file.uuid]
    return record
  }

  public async openFileBackup(record: FileBackupRecord): Promise<void> {
    const location = this.getFilesBackupsLocation()
    await this.device.openLocation(`${location}/${record.relativePath}`)
  }

  private async handleChangedFiles(files: FileItem[]): Promise<void> {
    if (files.length === 0 || !this.isFilesBackupsEnabled()) {
      return
    }

    const mapping = await this.getBackupsMappingFromDisk()
    if (!mapping) {
      throw new ClientDisplayableError('No backups mapping found')
    }

    for (const file of files) {
      if (this.pendingFiles.has(file.uuid)) {
        continue
      }

      const record = mapping[file.uuid]

      if (record == undefined) {
        this.pendingFiles.add(file.uuid)

        await this.performBackupOperation(file)

        this.pendingFiles.delete(file.uuid)
      }
    }

    this.invalidateMappingCache()
  }

  private async handleChangedNotes(notes: SNNote[]): Promise<void> {
    if (notes.length === 0 || !this.isPlaintextBackupsEnabled()) {
      return
    }

    const location = this.getPlaintextBackupsLocation()
    if (!location) {
      throw new ClientDisplayableError('No plaintext backups location found')
    }

    for (const note of notes) {
      const tags = this.items.getSortedTagsForItem(note)
      const tagNames = tags.map((tag) => this.items.getTagLongTitle(tag))
      await this.device.savePlaintextNoteBackup(location, note.uuid, note.title, tagNames, note.text)
    }

    await this.device.persistPlaintextBackupsMappingFile(location)
  }

  private async handleChangedTags(tags: SNTag[]): Promise<void> {
    if (tags.length === 0 || !this.isPlaintextBackupsEnabled()) {
      return
    }

    for (const tag of tags) {
      const notes = this.items.referencesForItem<SNNote>(tag, ContentType.Note)
      await this.handleChangedNotes(notes)
    }
  }

  async readEncryptedFileFromBackup(uuid: string, onChunk: OnChunkCallback): Promise<'success' | 'failed' | 'aborted'> {
    const fileBackup = await this.getFileBackupInfo({ uuid })

    if (!fileBackup) {
      return 'failed'
    }

    const token = await this.device.getFileBackupReadToken(fileBackup)

    let readMore = true
    let index = 0

    while (readMore) {
      const { chunk, isLast, progress } = await this.device.readNextChunk(token)

      await onChunk({ data: chunk, index, isLast, progress })

      readMore = !isLast

      index++
    }

    return 'success'
  }

  private async performBackupOperation(file: FileItem): Promise<'success' | 'failed' | 'aborted'> {
    const location = this.getFilesBackupsLocation()
    if (!location) {
      return 'failed'
    }

    const messageId = this.status.addMessage(`Backing up file ${file.name}...`)

    const encryptedFile = await this.encryptor.encryptSplitSingle({
      usesItemsKeyWithKeyLookup: {
        items: [file.payload],
      },
    })

    const itemsKey = this.items.getDisplayableItemsKeys().find((k) => k.uuid === encryptedFile.items_key_id)

    if (!itemsKey) {
      return 'failed'
    }

    const encryptedItemsKey = await this.encryptor.encryptSplitSingle({
      usesRootKeyWithKeyLookup: {
        items: [itemsKey.payload],
      },
    })

    const token = await this.api.createFileValetToken(file.remoteIdentifier, 'read')

    if (token instanceof ClientDisplayableError) {
      return 'failed'
    }

    const metaFile: FileBackupMetadataFile = {
      info: {
        warning: 'Do not edit this file.',
        information: 'The file and key data below is encrypted with your account password.',
        instructions:
          'Drag and drop this metadata file into the File Backups preferences pane in the Standard Notes desktop or web application interface.',
      },
      file: CreateEncryptedBackupFileContextPayload(encryptedFile.ejected()),
      itemsKey: CreateEncryptedBackupFileContextPayload(encryptedItemsKey.ejected()),
      version: '1.0.0',
    }

    const metaFileAsString = JSON.stringify(metaFile, null, 2)

    const result = await this.device.saveFilesBackupsFile(location, file.uuid, metaFileAsString, {
      chunkSizes: file.encryptedChunkSizes,
      url: this.api.getFilesDownloadUrl(),
      valetToken: token,
    })

    this.status.removeMessage(messageId)

    if (result === 'failed') {
      const failMessageId = this.status.addMessage(`Failed to back up ${file.name}...`)
      setTimeout(() => {
        this.status.removeMessage(failMessageId)
      }, 2000)
    }

    return result
  }
}

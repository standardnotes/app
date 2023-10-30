import { InternalEventInterface } from './../Internal/InternalEventInterface'
import { ApplicationStageChangedEventPayload } from '../Event/ApplicationStageChangedEventPayload'
import { ApplicationEvent } from '../Event/ApplicationEvent'
import { InternalEventHandlerInterface } from '../Internal/InternalEventHandlerInterface'
import { NoteType } from '@standardnotes/features'
import { ApplicationStage } from '../Application/ApplicationStage'
import {
  PayloadEmitSource,
  FileItem,
  CreateEncryptedBackupFileContextPayload,
  SNNote,
  SNTag,
  isNote,
  NoteContent,
} from '@standardnotes/models'
import { ClientDisplayableError, ValetTokenOperation } from '@standardnotes/responses'
import {
  FilesApiInterface,
  FileBackupMetadataFile,
  FileBackupsDevice,
  FileBackupsMapping,
  FileBackupRecord,
  OnChunkCallback,
  BackupServiceInterface,
  DesktopWatchedDirectoriesChanges,
  SuperConverterServiceInterface,
  DirectoryManagerInterface,
} from '@standardnotes/files'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { ItemManagerInterface } from '../Item/ItemManagerInterface'
import { AbstractService } from '../Service/AbstractService'
import { StatusServiceInterface } from '../Status/StatusServiceInterface'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { StorageServiceInterface } from '../Storage/StorageServiceInterface'
import { StorageKey } from '../Storage/StorageKeys'
import { SessionsClientInterface } from '../Session/SessionsClientInterface'
import { PayloadManagerInterface } from '../Payloads/PayloadManagerInterface'
import { HistoryServiceInterface } from '../History/HistoryServiceInterface'
import { ContentType } from '@standardnotes/domain-core'
import { EncryptionProviderInterface } from '../Encryption/EncryptionProviderInterface'

const PlaintextBackupsDirectoryName = 'Plaintext Backups'
export const TextBackupsDirectoryName = 'Text Backups'
export const FileBackupsDirectoryName = 'File Backups'

export class FilesBackupService
  extends AbstractService
  implements BackupServiceInterface, InternalEventHandlerInterface
{
  private filesObserverDisposer: () => void
  private notesObserverDisposer: () => void
  private tagsObserverDisposer: () => void

  private pendingFiles = new Set<string>()
  private mappingCache?: FileBackupsMapping['files']

  private markdownConverter!: SuperConverterServiceInterface

  constructor(
    private items: ItemManagerInterface,
    private api: FilesApiInterface,
    private encryptor: EncryptionProviderInterface,
    private device: FileBackupsDevice,
    private status: StatusServiceInterface,
    private crypto: PureCryptoInterface,
    private storage: StorageServiceInterface,
    private session: SessionsClientInterface,
    private payloads: PayloadManagerInterface,
    private history: HistoryServiceInterface,
    private directory: DirectoryManagerInterface,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)

    this.filesObserverDisposer = items.addObserver<FileItem>(
      ContentType.TYPES.File,
      ({ changed, inserted, source }) => {
        const applicableSources = [
          PayloadEmitSource.LocalDatabaseLoaded,
          PayloadEmitSource.RemoteSaved,
          PayloadEmitSource.RemoteRetrieved,
        ]
        if (applicableSources.includes(source)) {
          void this.handleChangedFiles([...changed, ...inserted])
        }
      },
    )

    const noteAndTagSources = [
      PayloadEmitSource.RemoteSaved,
      PayloadEmitSource.RemoteRetrieved,
      PayloadEmitSource.OfflineSyncSaved,
    ]

    this.notesObserverDisposer = items.addObserver<SNNote>(ContentType.TYPES.Note, ({ changed, inserted, source }) => {
      if (noteAndTagSources.includes(source)) {
        void this.handleChangedNotes([...changed, ...inserted])
      }
    })

    this.tagsObserverDisposer = items.addObserver<SNTag>(ContentType.TYPES.Tag, ({ changed, inserted, source }) => {
      if (noteAndTagSources.includes(source)) {
        void this.handleChangedTags([...changed, ...inserted])
      }
    })
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (event.type === ApplicationEvent.ApplicationStageChanged) {
      const stage = (event.payload as ApplicationStageChangedEventPayload).stage
      if (stage === ApplicationStage.Launched_10) {
        void this.automaticallyEnableTextBackupsIfPreferenceNotSet()
      }
    }
  }

  setSuperConverter(converter: SuperConverterServiceInterface): void {
    this.markdownConverter = converter
  }

  async importWatchedDirectoryChanges(changes: DesktopWatchedDirectoriesChanges): Promise<void> {
    for (const change of changes) {
      const existingItem = this.items.findItem(change.itemUuid)
      if (!existingItem) {
        continue
      }

      if (!isNote(existingItem)) {
        continue
      }

      const newContent: NoteContent = {
        ...existingItem.payload.content,
        preview_html: undefined,
        preview_plain: undefined,
        text: change.content,
      }

      const payloadCopy = existingItem.payload.copy({
        content: newContent,
      })

      await this.payloads.importPayloads([payloadCopy], this.history.getHistoryMapCopy())
    }
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
    ;(this.session as unknown) = undefined
  }

  private async automaticallyEnableTextBackupsIfPreferenceNotSet(): Promise<void> {
    if (this.storage.getValue(StorageKey.TextBackupsEnabled) != undefined) {
      return
    }

    this.storage.setValue(StorageKey.TextBackupsEnabled, true)
    const documentsDir = await this.device.getUserDocumentsDirectory()
    if (!documentsDir) {
      return
    }

    const location = await this.device.joinPaths(
      documentsDir,
      await this.prependWorkspacePathForPath(TextBackupsDirectoryName),
    )
    this.storage.setValue(StorageKey.TextBackupsLocation, location)
  }

  openAllDirectoriesContainingBackupFiles(): void {
    const fileBackupsLocation = this.getFilesBackupsLocation()
    const plaintextBackupsLocation = this.getPlaintextBackupsLocation()
    const textBackupsLocation = this.getTextBackupsLocation()

    if (fileBackupsLocation) {
      void this.directory.openLocation(fileBackupsLocation)
    }

    if (plaintextBackupsLocation) {
      void this.directory.openLocation(plaintextBackupsLocation)
    }

    if (textBackupsLocation) {
      void this.directory.openLocation(textBackupsLocation)
    }
  }

  isFilesBackupsEnabled(): boolean {
    return this.storage.getValue(StorageKey.FileBackupsEnabled, undefined, false)
  }

  getFilesBackupsLocation(): string | undefined {
    return this.storage.getValue(StorageKey.FileBackupsLocation)
  }

  isTextBackupsEnabled(): boolean {
    return this.storage.getValue(StorageKey.TextBackupsEnabled, undefined, true)
  }

  async prependWorkspacePathForPath(path: string): Promise<string> {
    const workspacePath = this.session.getWorkspaceDisplayIdentifier()

    return this.device.joinPaths(workspacePath, path)
  }

  async enableTextBackups(): Promise<void> {
    let location = this.getTextBackupsLocation()
    if (!location) {
      location = await this.directory.presentDirectoryPickerForLocationChangeAndTransferOld(
        await this.prependWorkspacePathForPath(TextBackupsDirectoryName),
      )
      if (!location) {
        return
      }
    }

    this.storage.setValue(StorageKey.TextBackupsEnabled, true)
    this.storage.setValue(StorageKey.TextBackupsLocation, location)
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
      void this.directory.openLocation(location)
    }
  }

  async changeTextBackupsLocation(): Promise<string | undefined> {
    const oldLocation = this.getTextBackupsLocation()
    const newLocation = await this.directory.presentDirectoryPickerForLocationChangeAndTransferOld(
      await this.prependWorkspacePathForPath(TextBackupsDirectoryName),
      oldLocation,
    )

    if (!newLocation) {
      return undefined
    }

    this.storage.setValue(StorageKey.TextBackupsLocation, newLocation)

    return newLocation
  }

  async saveTextBackupData(data: string): Promise<void> {
    const location = this.getTextBackupsLocation()
    if (!location) {
      return
    }

    return this.device.saveTextBackupData(location, data)
  }

  isPlaintextBackupsEnabled(): boolean {
    return this.storage.getValue(StorageKey.PlaintextBackupsEnabled, undefined, false)
  }

  public async enablePlaintextBackups(): Promise<void> {
    let location = this.getPlaintextBackupsLocation()
    if (!location) {
      location = await this.directory.presentDirectoryPickerForLocationChangeAndTransferOld(
        await this.prependWorkspacePathForPath(PlaintextBackupsDirectoryName),
      )
      if (!location) {
        return
      }
    }

    this.storage.setValue(StorageKey.PlaintextBackupsEnabled, true)
    this.storage.setValue(StorageKey.PlaintextBackupsLocation, location)

    void this.handleChangedNotes(this.items.getItems<SNNote>(ContentType.TYPES.Note))
  }

  disablePlaintextBackups(): void {
    this.storage.setValue(StorageKey.PlaintextBackupsEnabled, false)
    this.storage.setValue(StorageKey.PlaintextBackupsLocation, undefined)
  }

  getPlaintextBackupsLocation(): string | undefined {
    return this.storage.getValue(StorageKey.PlaintextBackupsLocation)
  }

  async openPlaintextBackupsLocation(): Promise<void> {
    const location = this.getPlaintextBackupsLocation()
    if (location) {
      void this.directory.openLocation(location)
    }
  }

  async changePlaintextBackupsLocation(): Promise<string | undefined> {
    const oldLocation = this.getPlaintextBackupsLocation()
    const newLocation = await this.directory.presentDirectoryPickerForLocationChangeAndTransferOld(
      await this.prependWorkspacePathForPath(PlaintextBackupsDirectoryName),
      oldLocation,
    )

    if (!newLocation) {
      return undefined
    }

    this.storage.setValue(StorageKey.PlaintextBackupsLocation, newLocation)

    return newLocation
  }

  public async enableFilesBackups(): Promise<void> {
    let location = this.getFilesBackupsLocation()
    if (!location) {
      location = await this.directory.presentDirectoryPickerForLocationChangeAndTransferOld(
        await this.prependWorkspacePathForPath(FileBackupsDirectoryName),
      )
      if (!location) {
        return
      }
    }

    this.storage.setValue(StorageKey.FileBackupsEnabled, true)
    this.storage.setValue(StorageKey.FileBackupsLocation, location)

    this.backupAllFiles()
  }

  private backupAllFiles(): void {
    const files = this.items.getItems<FileItem>(ContentType.TYPES.File)

    void this.handleChangedFiles(files)
  }

  public disableFilesBackups(): void {
    this.storage.setValue(StorageKey.FileBackupsEnabled, false)
  }

  public async changeFilesBackupsLocation(): Promise<string | undefined> {
    const oldLocation = this.getFilesBackupsLocation()
    const newLocation = await this.directory.presentDirectoryPickerForLocationChangeAndTransferOld(
      await this.prependWorkspacePathForPath(FileBackupsDirectoryName),
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
      void this.directory.openLocation(location)
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

  public getFileBackupAbsolutePath(record: FileBackupRecord): Promise<string> {
    const location = this.getFilesBackupsLocation()
    if (!location) {
      throw new ClientDisplayableError('No files backups location set')
    }
    return this.device.joinPaths(location, record.relativePath)
  }

  public async openFileBackup(record: FileBackupRecord): Promise<void> {
    const location = await this.getFileBackupAbsolutePath(record)
    await this.directory.openLocation(location)
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

    if (!this.markdownConverter) {
      throw 'Super markdown converter not initialized'
    }

    for (const note of notes) {
      const tags = this.items.getSortedTagsForItem(note)
      const tagNames = tags.map((tag) => this.items.getTagLongTitle(tag))
      const text =
        note.noteType === NoteType.Super
          ? await this.markdownConverter.convertSuperStringToOtherFormat(note.text, 'md')
          : note.text
      await this.device.savePlaintextNoteBackup(location, note.uuid, note.title, tagNames, text)
    }

    await this.device.persistPlaintextBackupsMappingFile(location)
  }

  private async handleChangedTags(tags: SNTag[]): Promise<void> {
    if (tags.length === 0 || !this.isPlaintextBackupsEnabled()) {
      return
    }

    for (const tag of tags) {
      const notes = this.items.referencesForItem<SNNote>(tag, ContentType.TYPES.Note)
      await this.handleChangedNotes(notes)
    }
  }

  async readEncryptedFileFromBackup(uuid: string, onChunk: OnChunkCallback): Promise<'success' | 'failed' | 'aborted'> {
    const fileBackup = await this.getFileBackupInfo({ uuid })

    if (!fileBackup) {
      return 'failed'
    }

    const fileBackupsLocation = this.getFilesBackupsLocation()

    if (!fileBackupsLocation) {
      return 'failed'
    }

    const path = await this.device.joinPaths(fileBackupsLocation, fileBackup.relativePath, fileBackup.binaryFileName)
    const token = await this.device.getFileBackupReadToken(path)

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
      this.status.removeMessage(messageId)
      return 'failed'
    }

    const encryptedItemsKey = await this.encryptor.encryptSplitSingle({
      usesRootKeyWithKeyLookup: {
        items: [itemsKey.payload],
      },
    })

    const token = await this.api.createUserFileValetToken(file.remoteIdentifier, ValetTokenOperation.Read)

    if (token instanceof ClientDisplayableError) {
      this.status.removeMessage(messageId)
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

    const downloadType = !file.user_uuid || file.user_uuid === this.session.getSureUser().uuid ? 'user' : 'shared-vault'

    const result = await this.device.saveFilesBackupsFile(location, file.uuid, metaFileAsString, {
      chunkSizes: file.encryptedChunkSizes,
      url: this.api.getFilesDownloadUrl(downloadType),
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

  /**
   * Not presently used or enabled. It works, but presently has the following edge cases:
   * 1. Editing the note directly in SN triggers an immediate backup which triggers a file change which triggers the observer
   * 2. Since changes are based on filenames, a note with the same title as another may not properly map to the correct uuid
   * 3. Opening the file triggers a watch event from Node's watch API.
   * 4. Gives web code ability to monitor arbitrary locations. Needs whitelisting mechanism.
   */
  disabledExperimental_monitorPlaintextBackups(): void {
    const location = this.getPlaintextBackupsLocation()
    if (location) {
      void this.device.monitorPlaintextBackupsLocationForChanges(location)
    }
  }
}

import {
  FileDownloadProgress,
  fileProgressToHumanReadableString,
  FilesClientInterface,
  OnChunkCallbackNoProgress,
} from '@standardnotes/files'
import { FilePreviewModalController } from './FilePreviewModalController'
import { FileItemAction, FileItemActionType } from '@/Components/AttachedFilesPopover/PopoverFileItemAction'
import { BYTES_IN_ONE_MEGABYTE } from '@/Constants/Constants'
import {
  ArchiveManager,
  confirmDialog,
  IsNativeMobileWeb,
  VaultDisplayServiceInterface,
} from '@standardnotes/ui-services'
import { Strings, StringUtils } from '@/Constants/Strings'
import { concatenateUint8Arrays } from '@/Utils/ConcatenateUint8Arrays'
import {
  ClassicFileReader,
  StreamingFileReader,
  StreamingFileSaver,
  ClassicFileSaver,
  parseFileName,
} from '@standardnotes/filepicker'
import {
  AlertService,
  ChallengeReason,
  ClientDisplayableError,
  ContentType,
  FileItem,
  InternalEventBusInterface,
  isFile,
  ItemManagerInterface,
  MobileDeviceInterface,
  MutatorClientInterface,
  Platform,
  ProtectionsClientInterface,
  SNNote,
  SyncServiceInterface,
  VaultServiceInterface,
} from '@standardnotes/snjs'
import { addToast, dismissToast, ToastType, updateToast } from '@standardnotes/toast'
import { action, makeObservable, observable, reaction } from 'mobx'
import { AbstractViewController } from './Abstract/AbstractViewController'
import { NotesController } from './NotesController/NotesController'
import { downloadOrShareBlobBasedOnPlatform } from '@/Utils/DownloadOrShareBasedOnPlatform'

const UnprotectedFileActions = [FileItemActionType.ToggleFileProtection]
const NonMutatingFileActions = [FileItemActionType.DownloadFile, FileItemActionType.PreviewFile]

type FileContextMenuLocation = { x: number; y: number }

export type FilesControllerEventData = {
  [FilesControllerEvent.FileUploadedToNote]: {
    uuid: string
  }
}

export enum FilesControllerEvent {
  FileUploadedToNote,
}

export class FilesController extends AbstractViewController<FilesControllerEvent, FilesControllerEventData> {
  allFiles: FileItem[] = []
  attachedFiles: FileItem[] = []
  showFileContextMenu = false
  showProtectedOverlay = false
  fileContextMenuLocation: FileContextMenuLocation = { x: 0, y: 0 }

  shouldUseStreamingReader = StreamingFileSaver.available()
  reader = this.shouldUseStreamingReader ? StreamingFileReader : ClassicFileReader
  maxFileSize = this.reader.maximumFileSize()

  override deinit(): void {
    super.deinit()
    ;(this.notesController as unknown) = undefined
    ;(this.filePreviewModalController as unknown) = undefined
  }

  constructor(
    private notesController: NotesController,
    private filePreviewModalController: FilePreviewModalController,
    private archiveService: ArchiveManager,
    private vaultDisplayService: VaultDisplayServiceInterface,
    private vaults: VaultServiceInterface,
    private items: ItemManagerInterface,
    private files: FilesClientInterface,
    private mutator: MutatorClientInterface,
    private sync: SyncServiceInterface,
    private protections: ProtectionsClientInterface,
    private alerts: AlertService,
    private platform: Platform,
    private mobileDevice: MobileDeviceInterface | undefined,
    private _isNativeMobileWeb: IsNativeMobileWeb,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)

    makeObservable(this, {
      allFiles: observable,
      attachedFiles: observable,
      showFileContextMenu: observable,
      fileContextMenuLocation: observable,

      showProtectedOverlay: observable,

      reloadAllFiles: action,
      reloadAttachedFiles: action,
      setShowFileContextMenu: action,
      setShowProtectedOverlay: action,
      setFileContextMenuLocation: action,
    })

    this.disposers.push(
      items.streamItems(ContentType.TYPES.File, () => {
        this.reloadAllFiles()
        this.reloadAttachedFiles()
      }),
    )

    this.disposers.push(
      reaction(
        () => notesController.selectedNotes,
        () => {
          this.reloadAttachedFiles()
        },
      ),
    )
  }

  setShowFileContextMenu = (enabled: boolean) => {
    this.showFileContextMenu = enabled
  }

  setShowProtectedOverlay = (enabled: boolean) => {
    this.showProtectedOverlay = enabled
  }

  setFileContextMenuLocation = (location: FileContextMenuLocation) => {
    this.fileContextMenuLocation = location
  }

  reloadAllFiles = () => {
    this.allFiles = this.items.getDisplayableFiles()
  }

  reloadAttachedFiles = () => {
    const note = this.notesController.firstSelectedNote
    if (note) {
      this.attachedFiles = this.items.itemsReferencingItem(note).filter(isFile)
    }
  }

  deleteFile = async (file: FileItem) => {
    const shouldDelete = await confirmDialog({
      text: `Are you sure you want to permanently delete "${file.name}"?`,
      confirmButtonStyle: 'danger',
    })
    if (shouldDelete) {
      const deletingToastId = addToast({
        type: ToastType.Loading,
        message: `Deleting file "${file.name}"...`,
      })
      await this.files.deleteFile(file)
      addToast({
        type: ToastType.Success,
        message: `Deleted file "${file.name}"`,
      })
      dismissToast(deletingToastId)
    }
  }

  attachFileToSelectedNote = async (file: FileItem) => {
    const note = this.notesController.firstSelectedNote
    if (!note) {
      addToast({
        type: ToastType.Error,
        message: 'Could not attach file because selected note was deleted',
      })
      return
    }

    await this.mutator.associateFileWithNote(file, note)
    void this.sync.sync()
  }

  detachFileFromNote = async (file: FileItem) => {
    const note = this.notesController.firstSelectedNote
    if (!note) {
      addToast({
        type: ToastType.Error,
        message: 'Could not attach file because selected note was deleted',
      })
      return
    }
    await this.mutator.disassociateFileWithNote(file, note)
    void this.sync.sync()
  }

  toggleFileProtection = async (file: FileItem) => {
    let result: FileItem | undefined
    if (file.protected) {
      result = await this.protections.unprotectFile(file)
    } else {
      result = await this.protections.protectFile(file)
    }
    void this.sync.sync()
    const isProtected = result ? result.protected : file.protected
    return isProtected
  }

  authorizeProtectedActionForFile = async (file: FileItem, challengeReason: ChallengeReason) => {
    const authorizedFiles = await this.protections.authorizeProtectedActionForItems([file], challengeReason)
    const isAuthorized = authorizedFiles.length > 0 && authorizedFiles.includes(file)
    return isAuthorized
  }

  renameFile = async (file: FileItem, fileName: string) => {
    await this.mutator.renameFile(file, fileName)
    void this.sync.sync()
  }

  handleFileAction = async (
    action: FileItemAction,
  ): Promise<{
    didHandleAction: boolean
  }> => {
    const file = action.payload.file
    let isAuthorizedForAction = true

    const requiresAuthorization = file.protected && !UnprotectedFileActions.includes(action.type)

    if (requiresAuthorization) {
      isAuthorizedForAction = await this.authorizeProtectedActionForFile(file, ChallengeReason.AccessProtectedFile)
    }

    if (!isAuthorizedForAction) {
      return {
        didHandleAction: false,
      }
    }

    switch (action.type) {
      case FileItemActionType.AttachFileToNote:
        await this.attachFileToSelectedNote(file)
        break
      case FileItemActionType.DetachFileToNote:
        await this.detachFileFromNote(file)
        break
      case FileItemActionType.DeleteFile:
        await this.deleteFile(file)
        break
      case FileItemActionType.DownloadFile:
        await this.downloadFile(file)
        break
      case FileItemActionType.ToggleFileProtection: {
        const isProtected = await this.toggleFileProtection(file)
        action.callback(isProtected)
        break
      }
      case FileItemActionType.RenameFile:
        await this.renameFile(file, action.payload.name)
        break
      case FileItemActionType.PreviewFile:
        this.filePreviewModalController.activate(file, action.payload.otherFiles)
        break
    }

    if (!NonMutatingFileActions.includes(action.type)) {
      this.sync.sync().catch(console.error)
    }

    return {
      didHandleAction: true,
    }
  }

  getFileBlob = async (file: FileItem): Promise<Blob | undefined> => {
    const chunks: Uint8Array[] = []
    const error = await this.files.downloadFile(file, async (decryptedChunk) => {
      chunks.push(decryptedChunk)
    })
    if (error) {
      return
    }
    const finalDecryptedBytes = concatenateUint8Arrays(chunks)
    return new Blob([finalDecryptedBytes], {
      type: file.mimeType,
    })
  }

  private async downloadFile(file: FileItem): Promise<void> {
    let downloadingToastId = ''
    let canShowProgressNotification = false

    if (this.mobileDevice && this.platform === Platform.Android) {
      canShowProgressNotification = await this.mobileDevice.canDisplayNotifications()
    }

    try {
      const saver = StreamingFileSaver.available() ? new StreamingFileSaver(file.name) : new ClassicFileSaver()

      const isUsingStreamingSaver = saver instanceof StreamingFileSaver

      if (isUsingStreamingSaver) {
        await saver.selectFileToSaveTo()
      }

      if (this.mobileDevice && canShowProgressNotification) {
        downloadingToastId = await this.mobileDevice.displayNotification({
          title: `Downloading file "${file.name}"`,
          android: {
            progress: { max: 100, current: 0, indeterminate: true },
            onlyAlertOnce: true,
          },
        })
      } else {
        downloadingToastId = addToast({
          type: ToastType.Progress,
          message: `Downloading file "${file.name}" (0%)`,
          progress: 0,
        })
      }

      const decryptedBytesArray: Uint8Array[] = []

      let lastProgress: FileDownloadProgress | undefined

      const result = await this.files.downloadFile(file, async (decryptedBytes, progress) => {
        if (isUsingStreamingSaver) {
          await saver.pushBytes(decryptedBytes)
        } else {
          decryptedBytesArray.push(decryptedBytes)
        }

        const progressPercent = Math.floor(progress.percentComplete)

        if (this.mobileDevice && canShowProgressNotification) {
          this.mobileDevice
            .displayNotification({
              id: downloadingToastId,
              title: `Downloading file "${file.name}"`,
              android: {
                progress: { max: 100, current: progressPercent, indeterminate: false },
                onlyAlertOnce: true,
              },
            })
            .catch(console.error)
        } else {
          updateToast(downloadingToastId, {
            message: fileProgressToHumanReadableString(progress, file.name, { showPercent: true }),
            progress: progressPercent,
          })
        }

        lastProgress = progress
      })

      if (result instanceof ClientDisplayableError) {
        throw new Error(result.text)
      }

      if (isUsingStreamingSaver) {
        await saver.finish()
      } else {
        const finalBytes = concatenateUint8Arrays(decryptedBytesArray)
        const blob = new Blob([finalBytes], {
          type: file.mimeType,
        })
        await downloadOrShareBlobBasedOnPlatform({
          archiveService: this.archiveService,
          platform: this.platform,
          mobileDevice: this.mobileDevice,
          blob,
          filename: file.name,
          isNativeMobileWeb: this._isNativeMobileWeb.execute().getValue(),
          showToastOnAndroid: false,
        })
      }

      if (this.mobileDevice && canShowProgressNotification) {
        await this.mobileDevice.displayNotification({
          title: `Successfully downloaded file "${file.name}"`,
        })
      } else {
        addToast({
          type: ToastType.Success,
          message: `Successfully downloaded file${
            lastProgress && lastProgress.source === 'local' ? ' from local backup' : ''
          }`,
        })
      }
    } catch (error) {
      console.error(error)

      addToast({
        type: ToastType.Error,
        message: 'There was an error while downloading the file',
      })
    }

    if (downloadingToastId) {
      if (this.mobileDevice && canShowProgressNotification) {
        this.mobileDevice.cancelNotification(downloadingToastId).catch(console.error)
      } else {
        dismissToast(downloadingToastId)
      }
    }
  }

  alertIfFileExceedsSizeLimit = (file: File): boolean => {
    if (!this.shouldUseStreamingReader && this.maxFileSize && file.size >= this.maxFileSize) {
      this.alerts
        .alert(
          `This file exceeds the limits supported in this browser. To upload files greater than ${
            this.maxFileSize / BYTES_IN_ONE_MEGABYTE
          }MB, please use the desktop application or the Chrome browser.`,
          `Cannot upload file "${file.name}"`,
        )
        .catch(console.error)
      return true
    }
    return false
  }

  public async selectAndUploadNewFiles(note?: SNNote, callback?: (file: FileItem) => void) {
    const selectedFiles = await this.reader.selectFiles()

    selectedFiles.forEach(async (file) => {
      if (this.alertIfFileExceedsSizeLimit(file)) {
        return
      }
      const uploadedFile = await this.uploadNewFile(file, {
        note,
      })
      if (uploadedFile && callback) {
        callback(uploadedFile)
      }
    })
  }

  public async uploadNewFile(
    fileOrHandle: File | FileSystemFileHandle,
    options: {
      showToast?: boolean
      note?: SNNote
    } = {},
  ): Promise<FileItem | undefined> {
    const { showToast = true, note } = options

    let toastId: string | undefined
    let canShowProgressNotification = false

    if (showToast && this.mobileDevice && this.platform === Platform.Android) {
      canShowProgressNotification = await this.mobileDevice.canDisplayNotifications()
    }

    try {
      const minimumChunkSize = this.files.minimumChunkSize()

      const fileToUpload =
        fileOrHandle instanceof File
          ? fileOrHandle
          : fileOrHandle instanceof FileSystemFileHandle && this.shouldUseStreamingReader
          ? await fileOrHandle.getFile()
          : undefined

      if (!fileToUpload) {
        return
      }

      if (this.alertIfFileExceedsSizeLimit(fileToUpload)) {
        return
      }

      const vaultForNote = note ? this.vaults.getItemVault(note) : undefined

      const operation = await this.files.beginNewFileUpload(
        fileToUpload.size,
        vaultForNote || this.vaultDisplayService.exclusivelyShownVault,
      )

      if (operation instanceof ClientDisplayableError) {
        addToast({
          type: ToastType.Error,
          message: 'Unable to start upload session',
        })
        throw new Error('Unable to start upload session')
      }

      const initialProgress = operation.getProgress().percentComplete

      if (showToast) {
        if (this.mobileDevice && canShowProgressNotification) {
          toastId = await this.mobileDevice.displayNotification({
            title: `Uploading file "${fileToUpload.name}"`,
            android: {
              progress: { max: 100, current: initialProgress, indeterminate: true },
              onlyAlertOnce: true,
            },
          })
        } else {
          toastId = addToast({
            type: ToastType.Progress,
            message: `Uploading file "${fileToUpload.name}" (${initialProgress}%)`,
            progress: initialProgress,
          })
        }
      }

      const onChunk: OnChunkCallbackNoProgress = async ({ data, index, isLast }) => {
        await this.files.pushBytesForUpload(operation, data, index, isLast)

        const percentComplete = Math.round(operation.getProgress().percentComplete)
        if (toastId) {
          if (this.mobileDevice && canShowProgressNotification) {
            await this.mobileDevice.displayNotification({
              id: toastId,
              title: `Uploading file "${fileToUpload.name}"`,
              android: {
                progress: { max: 100, current: percentComplete, indeterminate: false },
                onlyAlertOnce: true,
              },
            })
          } else {
            updateToast(toastId, {
              message: `Uploading file "${fileToUpload.name}" (${percentComplete}%)`,
              progress: percentComplete,
            })
          }
        }
      }

      const fileResult = await this.reader.readFile(fileToUpload, minimumChunkSize, onChunk)

      if (!fileResult.mimeType) {
        const { ext } = parseFileName(fileToUpload.name)
        fileResult.mimeType = await this.archiveService.getMimeType(ext)
      }

      const uploadedFile = await this.files.finishUpload(operation, fileResult)

      if (uploadedFile instanceof ClientDisplayableError) {
        addToast({
          type: ToastType.Error,
          message: uploadedFile.text,
        })
        throw new Error(uploadedFile.text)
      }

      if (toastId) {
        if (this.mobileDevice && canShowProgressNotification) {
          this.mobileDevice.cancelNotification(toastId).catch(console.error)
        }
        dismissToast(toastId)
      }
      if (showToast) {
        if (this.mobileDevice && canShowProgressNotification) {
          this.mobileDevice
            .displayNotification({
              title: `Uploaded file "${uploadedFile.name}"`,
            })
            .catch(console.error)
        } else {
          addToast({
            type: ToastType.Success,
            message: `Uploaded file "${uploadedFile.name}"`,
            actions: [
              {
                label: 'Open',
                handler: (toastId) => {
                  void this.handleFileAction({
                    type: FileItemActionType.PreviewFile,
                    payload: { file: uploadedFile },
                  })
                  dismissToast(toastId)
                },
              },
            ],
            autoClose: true,
          })
        }
      }

      return uploadedFile
    } catch (error) {
      console.error(error)

      if (toastId) {
        if (this.mobileDevice && canShowProgressNotification) {
          this.mobileDevice.cancelNotification(toastId).catch(console.error)
        }
        dismissToast(toastId)
      }
      if (this.mobileDevice && canShowProgressNotification) {
        this.mobileDevice
          .displayNotification({
            title: 'There was an error while uploading the file',
          })
          .catch(console.error)
      } else {
        addToast({
          type: ToastType.Error,
          message: 'There was an error while uploading the file',
        })
      }
    }

    return undefined
  }

  notifyObserversOfUploadedFileLinkingToCurrentNote(fileUuid: string) {
    this.notifyEvent(FilesControllerEvent.FileUploadedToNote, {
      [FilesControllerEvent.FileUploadedToNote]: { uuid: fileUuid },
    })
  }

  deleteFilesPermanently = async (files: FileItem[]) => {
    const title = Strings.trashItemsTitle
    const text = files.length === 1 ? StringUtils.deleteFile(files[0].name) : Strings.deleteMultipleFiles

    if (
      await confirmDialog({
        title,
        text,
        confirmButtonStyle: 'danger',
      })
    ) {
      await Promise.all(files.map((file) => this.files.deleteFile(file)))
      void this.sync.sync()
    }
  }

  setProtectionForFiles = async (protect: boolean, files: FileItem[]) => {
    if (protect) {
      const protectedItems = await this.protections.protectItems(files)
      if (protectedItems) {
        this.setShowProtectedOverlay(true)
      }
    } else {
      const unprotectedItems = await this.protections.unprotectItems(files, ChallengeReason.UnprotectFile)
      if (unprotectedItems) {
        this.setShowProtectedOverlay(false)
      }
    }
    void this.sync.sync()
  }

  downloadFiles = async (files: FileItem[]) => {
    if (this.platform === Platform.MacDesktop) {
      for (const file of files) {
        await this.handleFileAction({
          type: FileItemActionType.DownloadFile,
          payload: {
            file,
          },
        })
      }
      return
    }

    await Promise.all(
      files.map((file) =>
        this.handleFileAction({
          type: FileItemActionType.DownloadFile,
          payload: {
            file,
          },
        }),
      ),
    )
  }
}

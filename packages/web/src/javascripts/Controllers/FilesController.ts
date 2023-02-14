import {
  FileDownloadProgress,
  fileProgressToHumanReadableString,
  OnChunkCallbackNoProgress,
} from '@standardnotes/files'
import { FilePreviewModalController } from './FilePreviewModalController'
import { FileItemAction, FileItemActionType } from '@/Components/AttachedFilesPopover/PopoverFileItemAction'
import { BYTES_IN_ONE_MEGABYTE } from '@/Constants/Constants'
import { confirmDialog } from '@standardnotes/ui-services'
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
  ChallengeReason,
  ClientDisplayableError,
  ContentType,
  FileItem,
  InternalEventBus,
  isFile,
} from '@standardnotes/snjs'
import { addToast, dismissToast, ToastType, updateToast } from '@standardnotes/toast'
import { action, makeObservable, observable, reaction } from 'mobx'
import { WebApplication } from '../Application/Application'
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
    application: WebApplication,
    private notesController: NotesController,
    private filePreviewModalController: FilePreviewModalController,
    eventBus: InternalEventBus,
  ) {
    super(application, eventBus)

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
      application.streamItems(ContentType.File, () => {
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
    this.allFiles = this.application.items.getDisplayableFiles()
  }

  reloadAttachedFiles = () => {
    const note = this.notesController.firstSelectedNote
    if (note) {
      this.attachedFiles = this.application.items.itemsReferencingItem(note).filter(isFile)
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
      await this.application.files.deleteFile(file)
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

    await this.application.items.associateFileWithNote(file, note)
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
    await this.application.items.disassociateFileWithNote(file, note)
  }

  toggleFileProtection = async (file: FileItem) => {
    let result: FileItem | undefined
    if (file.protected) {
      result = await this.application.mutator.unprotectFile(file)
    } else {
      result = await this.application.mutator.protectFile(file)
    }
    const isProtected = result ? result.protected : file.protected
    return isProtected
  }

  authorizeProtectedActionForFile = async (file: FileItem, challengeReason: ChallengeReason) => {
    const authorizedFiles = await this.application.protections.authorizeProtectedActionForItems([file], challengeReason)
    const isAuthorized = authorizedFiles.length > 0 && authorizedFiles.includes(file)
    return isAuthorized
  }

  renameFile = async (file: FileItem, fileName: string) => {
    await this.application.items.renameFile(file, fileName)
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
      this.application.sync.sync().catch(console.error)
    }

    return {
      didHandleAction: true,
    }
  }

  public async downloadFile(file: FileItem): Promise<void> {
    let downloadingToastId = ''

    try {
      const saver = StreamingFileSaver.available() ? new StreamingFileSaver(file.name) : new ClassicFileSaver()

      const isUsingStreamingSaver = saver instanceof StreamingFileSaver

      if (isUsingStreamingSaver) {
        await saver.selectFileToSaveTo()
      }

      downloadingToastId = addToast({
        type: ToastType.Progress,
        message: `Downloading file "${file.name}" (0%)`,
        progress: 0,
      })

      const decryptedBytesArray: Uint8Array[] = []

      let lastProgress: FileDownloadProgress | undefined

      const result = await this.application.files.downloadFile(file, async (decryptedBytes, progress) => {
        if (isUsingStreamingSaver) {
          await saver.pushBytes(decryptedBytes)
        } else {
          decryptedBytesArray.push(decryptedBytes)
        }

        const progressPercent = Math.floor(progress.percentComplete)

        updateToast(downloadingToastId, {
          message: fileProgressToHumanReadableString(progress, file.name, { showPercent: true }),
          progress: progressPercent,
        })

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
        await downloadOrShareBlobBasedOnPlatform(this.application, blob, file.name, false)
      }

      addToast({
        type: ToastType.Success,
        message: `Successfully downloaded file${
          lastProgress && lastProgress.source === 'local' ? ' from local backup' : ''
        }`,
      })
    } catch (error) {
      console.error(error)

      addToast({
        type: ToastType.Error,
        message: 'There was an error while downloading the file',
      })
    }

    if (downloadingToastId.length > 0) {
      dismissToast(downloadingToastId)
    }
  }

  alertIfFileExceedsSizeLimit = (file: File): boolean => {
    if (!this.shouldUseStreamingReader && this.maxFileSize && file.size >= this.maxFileSize) {
      this.application.alertService
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

  public async selectAndUploadNewFiles(callback?: (file: FileItem) => void) {
    const selectedFiles = await this.reader.selectFiles()

    selectedFiles.forEach(async (file) => {
      if (this.alertIfFileExceedsSizeLimit(file)) {
        return
      }
      const uploadedFile = await this.uploadNewFile(file)
      if (uploadedFile && callback) {
        callback(uploadedFile)
      }
    })
  }

  public async uploadNewFile(
    fileOrHandle: File | FileSystemFileHandle,
    showProgressToast = true,
  ): Promise<FileItem | undefined> {
    let toastId: string | undefined

    try {
      const minimumChunkSize = this.application.files.minimumChunkSize()

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

      const operation = await this.application.files.beginNewFileUpload(fileToUpload.size)

      if (operation instanceof ClientDisplayableError) {
        addToast({
          type: ToastType.Error,
          message: 'Unable to start upload session',
        })
        throw new Error('Unable to start upload session')
      }

      const initialProgress = operation.getProgress().percentComplete

      if (showProgressToast) {
        toastId = addToast({
          type: ToastType.Progress,
          message: `Uploading file "${fileToUpload.name}" (${initialProgress}%)`,
          progress: initialProgress,
        })
      }

      const onChunk: OnChunkCallbackNoProgress = async ({ data, index, isLast }) => {
        await this.application.files.pushBytesForUpload(operation, data, index, isLast)

        const percentComplete = Math.round(operation.getProgress().percentComplete)
        if (toastId) {
          updateToast(toastId, {
            message: `Uploading file "${fileToUpload.name}" (${percentComplete}%)`,
            progress: percentComplete,
          })
        }
      }

      const fileResult = await this.reader.readFile(fileToUpload, minimumChunkSize, onChunk)

      if (!fileResult.mimeType) {
        const { ext } = parseFileName(fileToUpload.name)
        fileResult.mimeType = await this.application.getArchiveService().getMimeType(ext)
      }

      const uploadedFile = await this.application.files.finishUpload(operation, fileResult)

      if (uploadedFile instanceof ClientDisplayableError) {
        addToast({
          type: ToastType.Error,
          message: 'Unable to close upload session',
        })
        throw new Error('Unable to close upload session')
      }

      if (toastId) {
        dismissToast(toastId)
      }
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

      return uploadedFile
    } catch (error) {
      console.error(error)

      if (toastId) {
        dismissToast(toastId)
      }
      addToast({
        type: ToastType.Error,
        message: 'There was an error while uploading the file',
      })
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
      await Promise.all(files.map((file) => this.application.files.deleteFile(file)))
      void this.application.sync.sync()
    }
  }

  setProtectionForFiles = async (protect: boolean, files: FileItem[]) => {
    if (protect) {
      const protectedItems = await this.application.mutator.protectItems(files)
      if (protectedItems) {
        this.setShowProtectedOverlay(true)
      }
    } else {
      const unprotectedItems = await this.application.mutator.unprotectItems(files, ChallengeReason.UnprotectFile)
      if (unprotectedItems) {
        this.setShowProtectedOverlay(false)
      }
    }
    void this.application.sync.sync()
  }

  downloadFiles = async (files: FileItem[]) => {
    await Promise.all(files.map((file) => this.downloadFile(file)))
  }
}

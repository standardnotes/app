import {
  PopoverFileItemAction,
  PopoverFileItemActionType,
} from '@/Components/AttachedFilesPopover/PopoverFileItemAction'
import { PopoverTabs } from '@/Components/AttachedFilesPopover/PopoverTabs'
import { BYTES_IN_ONE_MEGABYTE } from '@/Constants/Constants'
import { confirmDialog } from '@/Services/AlertService'
import { concatenateUint8Arrays } from '@/Utils/ConcatenateUint8Arrays'
import {
  ClassicFileReader,
  StreamingFileReader,
  StreamingFileSaver,
  ClassicFileSaver,
  parseFileName,
} from '@standardnotes/filepicker'
import { ChallengeReason, ClientDisplayableError, ContentType, FileItem } from '@standardnotes/snjs'
import { addToast, dismissToast, ToastType, updateToast } from '@standardnotes/stylekit'
import { action, computed, makeObservable, observable, reaction } from 'mobx'
import { WebApplication } from '../Application/Application'
import { AbstractViewController } from './Abstract/AbstractViewController'
import { ViewControllerManager } from '../Services/ViewControllerManager/ViewControllerManager'

const UnprotectedFileActions = [PopoverFileItemActionType.ToggleFileProtection]
const NonMutatingFileActions = [PopoverFileItemActionType.DownloadFile, PopoverFileItemActionType.PreviewFile]

type FileContextMenuLocation = { x: number; y: number }

export class FilesController extends AbstractViewController {
  allFiles: FileItem[] = []
  attachedFiles: FileItem[] = []
  showFileContextMenu = false
  fileContextMenuLocation: FileContextMenuLocation = { x: 0, y: 0 }

  constructor(
    application: WebApplication,
    override viewControllerManager: ViewControllerManager,
    appObservers: (() => void)[],
  ) {
    super(application, viewControllerManager)

    makeObservable(this, {
      allFiles: observable,
      attachedFiles: observable,
      showFileContextMenu: observable,
      fileContextMenuLocation: observable,

      selectedFiles: computed,

      reloadAllFiles: action,
      reloadAttachedFiles: action,
      setShowFileContextMenu: action,
      setFileContextMenuLocation: action,
    })

    appObservers.push(
      application.streamItems(ContentType.File, () => {
        this.reloadAllFiles()
        this.reloadAttachedFiles()
      }),
      reaction(
        () => viewControllerManager.notesController.selectedNotes,
        () => {
          this.reloadAttachedFiles()
        },
      ),
    )
  }

  get selectedFiles(): FileItem[] {
    return this.viewControllerManager.selectionController.getSelectedItems<FileItem>(ContentType.File)
  }

  setShowFileContextMenu = (enabled: boolean) => {
    this.showFileContextMenu = enabled
  }

  setFileContextMenuLocation = (location: FileContextMenuLocation) => {
    this.fileContextMenuLocation = location
  }

  reloadAllFiles = () => {
    this.allFiles = this.application.items.getDisplayableFiles()
  }

  reloadAttachedFiles = () => {
    const note = this.viewControllerManager.notesController.firstSelectedNote
    if (note) {
      this.attachedFiles = this.application.items.getFilesForNote(note)
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

  attachFileToNote = async (file: FileItem) => {
    const note = this.viewControllerManager.notesController.firstSelectedNote
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
    const note = this.viewControllerManager.notesController.firstSelectedNote
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
    action: PopoverFileItemAction,
    currentTab: PopoverTabs,
  ): Promise<{
    didHandleAction: boolean
  }> => {
    const file = action.type !== PopoverFileItemActionType.RenameFile ? action.payload : action.payload.file
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
      case PopoverFileItemActionType.AttachFileToNote:
        await this.attachFileToNote(file)
        break
      case PopoverFileItemActionType.DetachFileToNote:
        await this.detachFileFromNote(file)
        break
      case PopoverFileItemActionType.DeleteFile:
        await this.deleteFile(file)
        break
      case PopoverFileItemActionType.DownloadFile:
        await this.downloadFile(file)
        break
      case PopoverFileItemActionType.ToggleFileProtection: {
        const isProtected = await this.toggleFileProtection(file)
        action.callback(isProtected)
        break
      }
      case PopoverFileItemActionType.RenameFile:
        await this.renameFile(file, action.payload.name)
        break
      case PopoverFileItemActionType.PreviewFile:
        this.viewControllerManager.filePreviewModalController.activate(
          file,
          currentTab === PopoverTabs.AllFiles ? this.allFiles : this.attachedFiles,
        )
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

      const result = await this.application.files.downloadFile(file, async (decryptedBytes, progress) => {
        if (isUsingStreamingSaver) {
          await saver.pushBytes(decryptedBytes)
        } else {
          decryptedBytesArray.push(decryptedBytes)
        }

        if (progress) {
          const progressPercent = Math.floor(progress.percentComplete)

          updateToast(downloadingToastId, {
            message: `Downloading file "${file.name}" (${progressPercent}%)`,
            progress: progressPercent,
          })
        }
      })

      if (result instanceof ClientDisplayableError) {
        throw new Error(result.text)
      }

      if (isUsingStreamingSaver) {
        await saver.finish()
      } else {
        const finalBytes = concatenateUint8Arrays(decryptedBytesArray)
        saver.saveFile(file.name, finalBytes)
      }

      addToast({
        type: ToastType.Success,
        message: 'Successfully downloaded file',
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

  public async uploadNewFile(fileOrHandle?: File | FileSystemFileHandle) {
    let toastId = ''

    try {
      const minimumChunkSize = this.application.files.minimumChunkSize()

      const shouldUseStreamingReader = StreamingFileReader.available()

      const picker = shouldUseStreamingReader ? StreamingFileReader : ClassicFileReader
      const maxFileSize = picker.maximumFileSize()

      const selectedFiles =
        fileOrHandle instanceof File
          ? [fileOrHandle]
          : StreamingFileReader.available() && fileOrHandle instanceof FileSystemFileHandle
          ? await StreamingFileReader.getFilesFromHandles([fileOrHandle])
          : await picker.selectFiles()

      if (selectedFiles.length === 0) {
        return
      }

      const uploadedFiles: FileItem[] = []

      for (const file of selectedFiles) {
        if (!shouldUseStreamingReader && maxFileSize && file.size >= maxFileSize) {
          this.application.alertService
            .alert(
              `This file exceeds the limits supported in this browser. To upload files greater than ${
                maxFileSize / BYTES_IN_ONE_MEGABYTE
              }MB, please use the desktop application or the Chrome browser.`,
              `Cannot upload file "${file.name}"`,
            )
            .catch(console.error)
          continue
        }

        const operation = await this.application.files.beginNewFileUpload(file.size)

        if (operation instanceof ClientDisplayableError) {
          addToast({
            type: ToastType.Error,
            message: 'Unable to start upload session',
          })
          throw new Error('Unable to start upload session')
        }

        const initialProgress = operation.getProgress().percentComplete

        toastId = addToast({
          type: ToastType.Progress,
          message: `Uploading file "${file.name}" (${initialProgress}%)`,
          progress: initialProgress,
        })

        const onChunk = async (chunk: Uint8Array, index: number, isLast: boolean) => {
          await this.application.files.pushBytesForUpload(operation, chunk, index, isLast)

          const progress = Math.round(operation.getProgress().percentComplete)
          updateToast(toastId, {
            message: `Uploading file "${file.name}" (${progress}%)`,
            progress,
          })
        }

        const fileResult = await picker.readFile(file, minimumChunkSize, onChunk)

        if (!fileResult.mimeType) {
          const { ext } = parseFileName(file.name)
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

        uploadedFiles.push(uploadedFile)

        dismissToast(toastId)
        addToast({
          type: ToastType.Success,
          message: `Uploaded file "${uploadedFile.name}"`,
        })
      }

      return uploadedFiles
    } catch (error) {
      console.error(error)

      if (toastId.length > 0) {
        dismissToast(toastId)
      }
      addToast({
        type: ToastType.Error,
        message: 'There was an error while uploading the file',
      })
    }

    return undefined
  }
}

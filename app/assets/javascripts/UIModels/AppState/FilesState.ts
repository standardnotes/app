import { BYTES_IN_ONE_MEGABYTE } from '@/Constants'
import { concatenateUint8Arrays } from '@/Utils/ConcatenateUint8Arrays'
import {
  ClassicFileReader,
  StreamingFileReader,
  StreamingFileSaver,
  ClassicFileSaver,
  parseFileName,
} from '@standardnotes/filepicker'
import { ClientDisplayableError, SNFile } from '@standardnotes/snjs'
import { addToast, dismissToast, ToastType } from '@standardnotes/stylekit'

import { WebApplication } from '../Application'

export class FilesState {
  constructor(private application: WebApplication) {}

  public async downloadFile(file: SNFile): Promise<void> {
    let downloadingToastId = ''

    try {
      const saver = StreamingFileSaver.available()
        ? new StreamingFileSaver(file.name)
        : new ClassicFileSaver()

      const isUsingStreamingSaver = saver instanceof StreamingFileSaver

      if (isUsingStreamingSaver) {
        await saver.selectFileToSaveTo()
      }

      downloadingToastId = addToast({
        type: ToastType.Loading,
        message: 'Downloading file...',
      })

      const decryptedBytesArray: Uint8Array[] = []

      await this.application.files.downloadFile(file, async (decryptedBytes: Uint8Array) => {
        if (isUsingStreamingSaver) {
          await saver.pushBytes(decryptedBytes)
        } else {
          decryptedBytesArray.push(decryptedBytes)
        }
      })

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

      const uploadedFiles: SNFile[] = []

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

        toastId = addToast({
          type: ToastType.Loading,
          message: `Uploading file "${file.name}"...`,
        })

        const operation = await this.application.files.beginNewFileUpload()

        if (operation instanceof ClientDisplayableError) {
          addToast({
            type: ToastType.Error,
            message: 'Unable to start upload session',
          })
          throw new Error('Unable to start upload session')
        }

        const onChunk = async (chunk: Uint8Array, index: number, isLast: boolean) => {
          await this.application.files.pushBytesForUpload(operation, chunk, index, isLast)
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

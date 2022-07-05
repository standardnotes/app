import { ByteChunker, FileSelectionResponse, OnChunkCallback } from '@standardnotes/filepicker'
import { FileDownloadProgress } from '@standardnotes/files'
import { ClientDisplayableError } from '@standardnotes/responses'
import { ApplicationService, FileItem } from '@standardnotes/snjs'
import { Buffer } from 'buffer'
import { Base64 } from 'js-base64'
import { PermissionsAndroid, Platform } from 'react-native'
import { DocumentPickerResponse } from 'react-native-document-picker'
import RNFS, { CachesDirectoryPath, DocumentDirectoryPath, DownloadDirectoryPath, read } from 'react-native-fs'
import { Asset } from 'react-native-image-picker'

type TGetFileDestinationPath = {
  fileName: string
  saveInTempLocation?: boolean
}

export class FilesService extends ApplicationService {
  private fileChunkSizeForReading = 2000000

  getDestinationPath({ fileName, saveInTempLocation = false }: TGetFileDestinationPath): string {
    let directory = DocumentDirectoryPath

    if (Platform.OS === 'android') {
      directory = saveInTempLocation ? CachesDirectoryPath : DownloadDirectoryPath
    }
    return `${directory}/${fileName}`
  }

  async hasStoragePermissionOnAndroid(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true
    }
    const grantedStatus = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE)
    if (grantedStatus === PermissionsAndroid.RESULTS.GRANTED) {
      return true
    }
    await this.application.alertService.alert(
      'Storage permissions are required in order to download files. Please accept the permissions prompt and try again.',
    )
    return false
  }

  async downloadFileInChunks(
    file: FileItem,
    path: string,
    handleOnChunk: (progress: FileDownloadProgress | undefined) => unknown,
  ): Promise<ClientDisplayableError | undefined> {
    const response = await this.application.files.downloadFile(file, async (decryptedBytes: Uint8Array, progress) => {
      const base64String = new Buffer(decryptedBytes).toString('base64')
      handleOnChunk(progress)

      await RNFS.appendFile(path, base64String, 'base64')
    })
    return response
  }

  getFileName(file: DocumentPickerResponse | Asset) {
    if ('name' in file) {
      return file.name
    }
    return file.fileName as string
  }

  async readFile(file: DocumentPickerResponse | Asset, onChunk: OnChunkCallback): Promise<FileSelectionResponse> {
    const fileUri = (Platform.OS === 'ios' ? decodeURI(file.uri!) : file.uri) as string

    let positionShift = 0
    let filePortion = ''

    const chunker = new ByteChunker(this.application.files.minimumChunkSize(), onChunk)
    let isFinalChunk = false

    do {
      filePortion = await read(fileUri, this.fileChunkSizeForReading, positionShift, 'base64')
      const bytes = Base64.toUint8Array(filePortion)
      isFinalChunk = bytes.length < this.fileChunkSizeForReading

      await chunker.addBytes(bytes, isFinalChunk)

      positionShift += this.fileChunkSizeForReading
    } while (!isFinalChunk)

    const fileName = this.getFileName(file)

    return {
      name: fileName,
      mimeType: file.type || '',
    }
  }

  sortByName(file1: FileItem, file2: FileItem): number {
    return file1.name.toLocaleLowerCase() > file2.name.toLocaleLowerCase() ? 1 : -1
  }

  formatCompletedPercent(percent: number | undefined) {
    return Math.round(percent || 0)
  }
}

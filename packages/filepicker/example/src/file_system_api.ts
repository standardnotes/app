import { StreamingFileReader, StreamingFileSaver } from '../../../filepicker'
import { SNApplication, FileItem, ClientDisplayableError } from '../../../snjs'

export class FileSystemApi {
  private uploadedFiles: FileItem[] = []

  constructor(private application: SNApplication) {
    this.configureFilePicker()
    this.configureDownloadButton()
  }

  get downloadButton(): HTMLButtonElement {
    return document.getElementById('downloadButton') as HTMLButtonElement
  }

  configureDownloadButton(): void {
    this.downloadButton.onclick = this.downloadFiles
    this.downloadButton.style.display = 'none'
  }

  configureFilePicker(): void {
    const button = document.getElementById('fileSystemUploadButton') as HTMLButtonElement
    button.onclick = this.uploadFiles
    console.log('File picker ready.')
  }

  uploadFiles = async (): Promise<void> => {
    const snFiles = []
    const selectedFiles = await StreamingFileReader.selectFiles()
    for (const file of selectedFiles) {
      const operation = await this.application.files.beginNewFileUpload()
      if (operation instanceof ClientDisplayableError) {
        continue
      }
      const fileResult = await StreamingFileReader.readFile(file, 2_000_000, async (chunk, index, isLast) => {
        await this.application.files.pushBytesForUpload(operation, chunk, index, isLast)
      })

      const snFile = await this.application.files.finishUpload(operation, fileResult)

      snFiles.push(snFile)
    }

    this.downloadButton.style.display = ''

    this.uploadedFiles = snFiles
  }

  downloadFiles = async (): Promise<void> => {
    for (const snFile of this.uploadedFiles) {
      console.log('Downloading file', snFile.remoteIdentifier)

      const saver = new StreamingFileSaver(snFile.name)
      await saver.selectFileToSaveTo()
      saver.loggingEnabled = true

      await this.application.files.downloadFile(snFile, async (decryptedBytes: Uint8Array) => {
        console.log(`Pushing ${decryptedBytes.length} decrypted bytes to disk`)
        await saver.pushBytes(decryptedBytes)
      })

      console.log('Closing file saver reader')
      await saver.finish()

      console.log('Successfully downloaded and decrypted file!')
    }
  }
}

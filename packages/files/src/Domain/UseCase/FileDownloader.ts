import { ClientDisplayableError } from '@standardnotes/responses'
import { FileDownloadProgress } from '../Types/FileDownloadProgress'
import { Deferred } from '@standardnotes/utils'
import { FileContent } from '@standardnotes/models'
import { FilesApiInterface } from '../Api/FilesApiInterface'

export type AbortSignal = 'aborted'
export type AbortFunction = () => void
type OnEncryptedBytes = (
  encryptedBytes: Uint8Array,
  progress: FileDownloadProgress,
  abort: AbortFunction,
) => Promise<void>

export type FileDownloaderResult = ClientDisplayableError | AbortSignal | undefined

export class FileDownloader {
  private aborted = false
  private abortDeferred = Deferred<AbortSignal>()
  private totalBytesDownloaded = 0

  constructor(
    private file: {
      uuid: string
      shared_vault_uuid: string | undefined
      encryptedChunkSizes: FileContent['encryptedChunkSizes']
      remoteIdentifier: FileContent['remoteIdentifier']
    },
    private readonly api: FilesApiInterface,
    private readonly valetToken: string,
  ) {}

  private getProgress(): FileDownloadProgress {
    const encryptedSize = this.file.encryptedChunkSizes.reduce((total, chunk) => total + chunk, 0)

    return {
      encryptedFileSize: encryptedSize,
      encryptedBytesDownloaded: this.totalBytesDownloaded,
      encryptedBytesRemaining: encryptedSize - this.totalBytesDownloaded,
      percentComplete: (this.totalBytesDownloaded / encryptedSize) * 100.0,
      source: 'network',
    }
  }

  public async run(onEncryptedBytes: OnEncryptedBytes): Promise<FileDownloaderResult> {
    return this.performDownload(onEncryptedBytes)
  }

  private async performDownload(onEncryptedBytes: OnEncryptedBytes): Promise<FileDownloaderResult> {
    const chunkIndex = 0
    const startRange = 0

    const onRemoteBytesReceived = async (bytes: Uint8Array) => {
      if (this.aborted) {
        return
      }

      this.totalBytesDownloaded += bytes.byteLength

      await onEncryptedBytes(bytes, this.getProgress(), this.abort)
    }

    const downloadPromise = this.api.downloadFile({
      file: this.file,
      chunkIndex,
      valetToken: this.valetToken,
      contentRangeStart: startRange,
      onBytesReceived: onRemoteBytesReceived,
      ownershipType: this.file.shared_vault_uuid ? 'shared-vault' : 'user',
    })

    const result = await Promise.race([this.abortDeferred.promise, downloadPromise])

    return result
  }

  public abort(): void {
    this.aborted = true

    this.abortDeferred.resolve('aborted')
  }
}

import { FileContent } from '@standardnotes/models'
import { DownloadFileType } from './DownloadFileType'

export type DownloadFileParams = {
  file: { encryptedChunkSizes: FileContent['encryptedChunkSizes'] }
  chunkIndex: number
  valetToken: string
  downloadType: DownloadFileType
  contentRangeStart: number
  onBytesReceived: (bytes: Uint8Array) => Promise<void>
}

import { FileDownloadProgress } from '../Types/FileDownloadProgress'

export type OnChunkCallback = (chunk: {
  data: Uint8Array
  index: number
  isLast: boolean
  progress: FileDownloadProgress
}) => Promise<void>

export type OnChunkCallbackNoProgress = (chunk: { data: Uint8Array; index: number; isLast: boolean }) => Promise<void>

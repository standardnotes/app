import { OnChunkCallbackNoProgress } from '@standardnotes/files'

import { FileSelectionResponse } from '../types'

export interface FileReaderInterface {
  selectFiles(): Promise<File[]>

  readFile(file: File, minimumChunkSize: number, onChunk: OnChunkCallbackNoProgress): Promise<FileSelectionResponse>

  available(): boolean

  maximumFileSize(): number | undefined
}

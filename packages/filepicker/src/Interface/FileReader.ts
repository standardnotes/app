import { OnChunkCallback, FileSelectionResponse } from '../types'

export interface FileReaderInterface {
  selectFiles(): Promise<File[]>

  readFile(file: File, minimumChunkSize: number, onChunk: OnChunkCallback): Promise<FileSelectionResponse>

  available(): boolean

  maximumFileSize(): number | undefined
}

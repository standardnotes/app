import { ByteChunker, OnChunkCallbackNoProgress } from '@standardnotes/files'
import { FileSelectionResponse } from '../types'
import { readFile as utilsReadFile } from '../utils'
import { FileReaderInterface } from '../Interface/FileReader'

export const ClassicFileReader: FileReaderInterface = {
  selectFiles,
  readFile,
  available,
  maximumFileSize,
}

function available(): boolean {
  return true
}

function maximumFileSize(): number {
  return 50 * 1_000_000
}

function selectFiles(): Promise<File[]> {
  const input = document.createElement('input') as HTMLInputElement
  input.type = 'file'
  input.multiple = true

  return new Promise((resolve) => {
    input.onchange = async (event) => {
      const target = event.target as HTMLInputElement
      const files = []
      for (const file of target.files as FileList) {
        files.push(file)
      }
      resolve(files)
    }
    input.click()
  })
}

async function readFile(
  file: File,
  minimumChunkSize: number,
  onChunk: OnChunkCallbackNoProgress,
): Promise<FileSelectionResponse> {
  const buffer = await utilsReadFile(file)
  const chunker = new ByteChunker(minimumChunkSize, onChunk)
  const readSize = 2_000_000

  for (let i = 0; i < buffer.length; i += readSize) {
    const chunkMax = i + readSize
    const chunk = buffer.slice(i, chunkMax)
    const isFinalChunk = chunkMax >= buffer.length
    await chunker.addBytes(chunk, isFinalChunk)
  }

  return {
    name: file.name,
    mimeType: file.type,
  }
}

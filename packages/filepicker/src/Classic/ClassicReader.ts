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

const FileInputId = 'classic-reader-file-input'
function createFileInputOrReturnExisting(): HTMLInputElement {
  let fileInput = document.getElementById(FileInputId) as HTMLInputElement
  if (fileInput) {
    return fileInput
  }

  fileInput = document.createElement('input')
  fileInput.id = FileInputId
  fileInput.type = 'file'
  fileInput.style.position = 'absolute'
  fileInput.style.top = '0'
  fileInput.style.left = '0'
  fileInput.style.height = '1px'
  fileInput.style.width = '1px'
  fileInput.style.opacity = '0'
  fileInput.style.zIndex = '-50'
  fileInput.multiple = true
  document.body.appendChild(fileInput)

  return fileInput
}

function selectFiles(): Promise<File[]> {
  const input = createFileInputOrReturnExisting()

  return new Promise((resolve) => {
    input.onchange = async (event) => {
      const target = event.target as HTMLInputElement
      const files = []
      for (const file of Array.from(target.files as FileList)) {
        files.push(file)
      }
      resolve(files)
      // Reset input value so that onchange is triggered again if the same file is selected
      input.value = ''
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

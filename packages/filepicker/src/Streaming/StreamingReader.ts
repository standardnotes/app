import { ByteChunker, OnChunkCallbackNoProgress } from '@standardnotes/files'
import { FileReaderInterface } from './../Interface/FileReader'
import { FileSelectionResponse } from '../types'

interface StreamingFileReaderInterface {
  getFilesFromHandles(handles: FileSystemFileHandle[]): Promise<File[]>
}

/**
 * The File System Access API File Picker
 * https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API
 */
export const StreamingFileReader: StreamingFileReaderInterface & FileReaderInterface = {
  getFilesFromHandles,
  selectFiles,
  readFile,
  available,
  maximumFileSize,
}

function maximumFileSize(): number | undefined {
  return undefined
}

function getFilesFromHandles(handles: FileSystemFileHandle[]): Promise<File[]> {
  return Promise.all(handles.map((handle) => handle.getFile()))
}

async function selectFiles(): Promise<File[]> {
  let selectedFilesHandles: FileSystemFileHandle[]
  try {
    selectedFilesHandles = await window.showOpenFilePicker({ multiple: true })
  } catch (error) {
    selectedFilesHandles = []
  }
  return getFilesFromHandles(selectedFilesHandles)
}

async function readFile(
  file: File,
  minimumChunkSize: number,
  onChunk: OnChunkCallbackNoProgress,
): Promise<FileSelectionResponse> {
  const byteChunker = new ByteChunker(minimumChunkSize, onChunk)
  const stream = file.stream() as unknown as ReadableStream
  const reader = stream.getReader()

  let previousChunk: Uint8Array

  const processChunk = async (result: ReadableStreamReadResult<Uint8Array>): Promise<void> => {
    if (result.done) {
      await byteChunker.addBytes(previousChunk, true)
      return
    }

    if (previousChunk) {
      await byteChunker.addBytes(previousChunk, false)
    }

    previousChunk = result.value

    return reader.read().then(processChunk)
  }

  await reader.read().then(processChunk)

  return {
    name: file.name,
    mimeType: file.type,
  }
}

function available(): boolean {
  return window.showOpenFilePicker != undefined
}

import {
  FileSystemApi,
  DirectoryHandle,
  FileHandleReadWrite,
  FileHandleRead,
  FileSystemNoSelection,
  FileSystemResult,
} from '@standardnotes/files'

interface WebDirectoryHandle extends DirectoryHandle {
  nativeHandle: FileSystemDirectoryHandle
}
interface WebFileHandleReadWrite extends FileHandleReadWrite {
  nativeHandle: FileSystemFileHandle
  writableStream: FileSystemWritableFileStream
}

interface WebFileHandleRead extends FileHandleRead {
  nativeHandle: FileSystemFileHandle
}

export class StreamingFileApi implements FileSystemApi {
  async selectDirectory(): Promise<DirectoryHandle | FileSystemNoSelection> {
    try {
      const nativeHandle = await window.showDirectoryPicker()

      return { nativeHandle }
    } catch (error) {
      return 'aborted'
    }
  }

  async createFile(directory: WebDirectoryHandle, name: string): Promise<WebFileHandleReadWrite> {
    const nativeHandle = await directory.nativeHandle.getFileHandle(name, { create: true })
    const writableStream = await nativeHandle.createWritable()

    return {
      nativeHandle,
      writableStream,
    }
  }

  async createDirectory(
    parentDirectory: WebDirectoryHandle,
    name: string,
  ): Promise<WebDirectoryHandle | FileSystemNoSelection> {
    const nativeHandle = await parentDirectory.nativeHandle.getDirectoryHandle(name, { create: true })
    return { nativeHandle }
  }

  async saveBytes(file: WebFileHandleReadWrite, bytes: Uint8Array): Promise<'success' | 'failed'> {
    await file.writableStream.write(bytes)

    return 'success'
  }

  async saveString(file: WebFileHandleReadWrite, contents: string): Promise<'success' | 'failed'> {
    await file.writableStream.write(contents)

    return 'success'
  }

  async closeFileWriteStream(file: WebFileHandleReadWrite): Promise<'success' | 'failed'> {
    await file.writableStream.close()

    return 'success'
  }

  async selectFile(): Promise<WebFileHandleRead | FileSystemNoSelection> {
    try {
      const selection = await window.showOpenFilePicker()

      const file = selection[0]

      return {
        nativeHandle: file,
      }
    } catch (_) {
      return 'aborted'
    }
  }

  async readFile(
    fileHandle: WebFileHandleRead,
    onBytes: (bytes: Uint8Array, isLast: boolean) => Promise<void>,
  ): Promise<FileSystemResult> {
    const file = await fileHandle.nativeHandle.getFile()
    const stream = file.stream() as unknown as ReadableStream
    const reader = stream.getReader()

    let previousChunk: Uint8Array

    const processChunk = async (result: ReadableStreamReadResult<Uint8Array>): Promise<void> => {
      if (result.done) {
        await onBytes(previousChunk, true)
        return
      }

      if (previousChunk) {
        await onBytes(previousChunk, false)
      }

      previousChunk = result.value

      return reader.read().then(processChunk)
    }

    await reader.read().then(processChunk)

    return 'success'
  }
}

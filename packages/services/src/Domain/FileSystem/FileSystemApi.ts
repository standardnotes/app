export interface DirectoryHandle {
  nativeHandle: unknown
}
export interface FileHandleReadWrite {
  nativeHandle: unknown
  writableStream: unknown
}
export interface FileHandleRead {
  nativeHandle: unknown
}

export type FileSystemResult = 'aborted' | 'success' | 'failed'
export type FileSystemNoSelection = 'aborted' | 'failed'

export interface FileSystemApi {
  selectDirectory(): Promise<DirectoryHandle | FileSystemNoSelection>
  selectFile(): Promise<FileHandleRead | FileSystemNoSelection>
  readFile(
    file: FileHandleRead,
    onBytes: (bytes: Uint8Array, isLast: boolean) => Promise<void>,
  ): Promise<FileSystemResult>
  createDirectory(parentDirectory: DirectoryHandle, name: string): Promise<DirectoryHandle | FileSystemNoSelection>
  createFile(directory: DirectoryHandle, name: string): Promise<FileHandleReadWrite | FileSystemNoSelection>
  saveBytes(file: FileHandleReadWrite, bytes: Uint8Array): Promise<'success' | 'failed'>
  saveString(file: FileHandleReadWrite, contents: string): Promise<'success' | 'failed'>
  closeFileWriteStream(file: FileHandleReadWrite): Promise<'success' | 'failed'>
}

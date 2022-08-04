import { DirectoryHandle } from './DirectoryHandle'
import { FileHandleRead } from './FileHandleRead'
import { FileHandleReadWrite } from './FileHandleReadWrite'
import { FileSystemNoSelection } from './FileSystemNoSelection'
import { FileSystemResult } from './FileSystemResult'

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

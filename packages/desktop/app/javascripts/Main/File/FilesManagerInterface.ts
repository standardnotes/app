import { Result } from '@standardnotes/domain-core'
import { PathLike } from 'fs'

export interface FilesManagerInterface {
  debouncedJSONDiskWriter(durationMs: number, location: string, data: () => unknown): () => void
  openDirectoryPicker(buttonLabel?: string): Promise<string | undefined>
  readJSONFile<T>(filepath: string): Promise<T | undefined>
  readJSONFileSync<T>(filepath: string): T
  writeJSONFile(filepath: string, data: unknown): Promise<void>
  writeFile(filepath: string, data: string): Promise<void>
  writeJSONFileSync(filepath: string, data: unknown): void
  ensureDirectoryExists(dirPath: string): Promise<void>
  deleteDir(dirPath: string): Promise<Result<string>>
  deleteDirContents(dirPath: string): Promise<void>
  isChildOfDir(parent: string, potentialChild: string): boolean
  moveDirectory(dir: string, destination: string): Promise<Result<string>>
  moveDirContents(srcDir: string, destDir: string): Promise<Result<string>>
  extractZip(source: string, dest: string): Promise<void>
  moveFiles(sources: string[], destDir: string): Promise<void[]>
  moveFile(source: PathLike, destination: PathLike): Promise<void>
  deleteFileIfExists(filePath: PathLike): Promise<void>
  deleteFile(filePath: PathLike): Promise<void>
}

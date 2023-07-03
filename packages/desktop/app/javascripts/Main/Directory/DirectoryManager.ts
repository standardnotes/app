import path from 'path'
import { shell } from 'electron'
import { DirectoryManagerInterface } from '@standardnotes/snjs'

import { FilesManagerInterface } from '../File/FilesManagerInterface'

export class DirectoryManager implements DirectoryManagerInterface {
  private lastErrorMessage: string | undefined

  constructor(private filesManager: FilesManagerInterface) {}

  async presentDirectoryPickerForLocationChangeAndTransferOld(
    appendPath: string,
    oldLocation?: string,
  ): Promise<string | undefined> {
    try {
      this.lastErrorMessage = undefined

      const selectedDirectory = await this.filesManager.openDirectoryPicker('Select')

      if (!selectedDirectory) {
        return undefined
      }

      const newPath = path.join(selectedDirectory, path.normalize(appendPath))

      await this.filesManager.ensureDirectoryExists(newPath)

      if (oldLocation) {
        const result = await this.filesManager.moveDirectory(path.normalize(oldLocation), newPath)
        if (result.isFailed()) {
          this.lastErrorMessage = result.getError()

          return undefined
        }

        const deletingDirectoryResult = await this.filesManager.deleteDir(path.normalize(oldLocation))
        if (deletingDirectoryResult.isFailed()) {
          this.lastErrorMessage = deletingDirectoryResult.getError()

          return undefined
        }
      }

      return newPath
    } catch (error) {
      this.lastErrorMessage = (error as Error).message

      return undefined
    }
  }

  async openLocation(location: string): Promise<void> {
    void shell.openPath(location)
  }

  async getDirectoryManagerLastErrorMessage(): Promise<string | undefined> {
    return this.lastErrorMessage
  }
}

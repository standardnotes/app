import { dialog } from 'electron'
import fs, { PathLike } from 'fs'
import fse from 'fs-extra'
import { debounce } from 'lodash'
import path from 'path'
import yauzl from 'yauzl'
import { Result } from '@standardnotes/domain-core'

import { removeFromArray } from '../Utils/Utils'

import { FileErrorCodes } from './FileErrorCodes'
import { FilesManagerInterface } from './FilesManagerInterface'

export class FilesManager implements FilesManagerInterface {
  debouncedJSONDiskWriter(durationMs: number, location: string, data: () => unknown): () => void {
    let writingToDisk = false
    return debounce(async () => {
      if (writingToDisk) {
        return
      }
      writingToDisk = true
      try {
        await this.writeJSONFile(location, data())
      } catch (error) {
        console.error(error)
      } finally {
        writingToDisk = false
      }
    }, durationMs)
  }

  async openDirectoryPicker(buttonLabel?: string): Promise<string | undefined> {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'showHiddenFiles', 'createDirectory'],
      buttonLabel: buttonLabel,
    })

    return result.filePaths[0]
  }

  async readJSONFile<T>(filepath: string): Promise<T | undefined> {
    try {
      const data = await fs.promises.readFile(filepath, 'utf8')
      return JSON.parse(data)
    } catch (error) {
      return undefined
    }
  }

  readJSONFileSync<T>(filepath: string): T {
    const data = fs.readFileSync(filepath, 'utf8')
    return JSON.parse(data)
  }

  async writeJSONFile(filepath: string, data: unknown): Promise<void> {
    await this.ensureDirectoryExists(path.dirname(filepath))
    await fs.promises.writeFile(filepath, JSON.stringify(data, null, 2), 'utf8')
  }

  async writeFile(filepath: string, data: string): Promise<void> {
    await this.ensureDirectoryExists(path.dirname(filepath))
    await fs.promises.writeFile(filepath, data, 'utf8')
  }

  writeJSONFileSync(filepath: string, data: unknown): void {
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8')
  }

  async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      const stat = await fs.promises.lstat(dirPath)
      if (!stat.isDirectory()) {
        throw new Error('Tried to create a directory where a file of the same ' + `name already exists: ${dirPath}`)
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.code === FileErrorCodes.FileDoesNotExist) {
        /**
         * No directory here. Make sure there is a *parent* directory, and then
         * create it.
         */
        await this.ensureDirectoryExists(path.dirname(dirPath))

        /** Now that its parent(s) exist, create the directory */
        try {
          await fs.promises.mkdir(dirPath)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          if (error.code === FileErrorCodes.FileAlreadyExists) {
            /**
             * A concurrent process must have created the directory already.
             * Make sure it *is* a directory and not something else.
             */
            await this.ensureDirectoryExists(dirPath)
          } else {
            throw error
          }
        }
      } else {
        throw error
      }
    }
  }

  async deleteDir(dirPath: string): Promise<Result<string>> {
    try {
      fse.removeSync(dirPath)

      return Result.ok('Directory deleted successfully')
    } catch (error) {
      return Result.fail((error as Error).message)
    }
  }

  async deleteDirContents(dirPath: string): Promise<void> {
    /**
     * Scan the directory up to ten times, to handle cases where files are being added while
     * the directory's contents are being deleted
     */
    for (let i = 1, maxTries = 10; i < maxTries; i++) {
      const children = await fs.promises.readdir(dirPath, {
        withFileTypes: true,
      })

      if (children.length === 0) {
        break
      }

      for (const child of children) {
        const childPath = path.join(dirPath, child.name)
        if (child.isDirectory()) {
          await this.deleteDirContents(childPath)
          try {
            await fs.promises.rmdir(childPath)
          } catch (error) {
            if (error !== FileErrorCodes.FileDoesNotExist) {
              throw error
            }
          }
        } else {
          await this.deleteFile(childPath)
        }
      }
    }
  }

  isChildOfDir(parent: string, potentialChild: string): boolean {
    const relative = path.relative(parent, potentialChild)
    return !!relative && !relative.startsWith('..') && !path.isAbsolute(relative)
  }

  async moveDirectory(dir: string, destination: string): Promise<Result<string>> {
    try {
      await fse.move(dir, destination, { overwrite: true })

      return Result.ok('Directory moved successfully')
    } catch (error) {
      return Result.fail((error as Error).message)
    }
  }

  async moveDirContents(srcDir: string, destDir: string): Promise<Result<string>> {
    try {
      let srcDirectoryContents = await fs.promises.readdir(srcDir)

      await this.ensureDirectoryExists(destDir)

      if (this.isChildOfDir(srcDir, destDir)) {
        srcDirectoryContents = srcDirectoryContents.filter((name) => {
          return !this.isChildOfDir(destDir, path.join(srcDir, name))
        })
        removeFromArray(srcDirectoryContents, path.basename(destDir))
      }

      const directoryNames = []
      const fileNames = []
      for (const contentName of srcDirectoryContents) {
        const stats = await fs.promises.lstat(path.join(srcDir, contentName))
        if (stats.isDirectory()) {
          directoryNames.push(contentName)

          continue
        }

        fileNames.push(contentName)
      }

      for (const directoryName of directoryNames) {
        const result = await this.moveDirContents(path.join(srcDir, directoryName), path.join(destDir, directoryName))
        if (result.isFailed()) {
          return result
        }
      }

      await this.moveFiles(
        fileNames.map((fileName) => path.join(srcDir, fileName)),
        destDir,
      )

      return Result.ok('Directory contents moved successfully')
    } catch (error) {
      console.error(error)

      return Result.fail(`Could not move directory contentes: ${(error as Error).message}`)
    }
  }

  async extractZip(source: string, dest: string): Promise<void> {
    return new Promise((resolve, reject) => {
      yauzl.open(source, { lazyEntries: true, autoClose: true }, (err, zipFile) => {
        let cancelled = false

        const tryReject = (err: Error) => {
          if (!cancelled) {
            cancelled = true
            reject(err)
          }
        }

        if (err) {
          return tryReject(err)
        }

        if (!zipFile) {
          return tryReject(new Error('zipFile === undefined'))
        }

        zipFile.readEntry()

        zipFile.on('close', resolve)

        zipFile.on('entry', (entry) => {
          if (cancelled) {
            return
          }

          const isEntryDirectory = entry.fileName.endsWith('/')
          if (isEntryDirectory) {
            zipFile.readEntry()
            return
          }

          zipFile.openReadStream(entry, async (err, stream) => {
            if (cancelled) {
              return
            }

            if (err) {
              return tryReject(err)
            }

            if (!stream) {
              return tryReject(new Error('stream === undefined'))
            }

            stream.on('error', tryReject)

            const filepath = path.join(dest, entry.fileName)

            try {
              await this.ensureDirectoryExists(path.dirname(filepath))
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
              return tryReject(error)
            }
            const writeStream = fs.createWriteStream(filepath).on('error', tryReject).on('error', tryReject)

            stream.pipe(writeStream).on('close', () => {
              zipFile.readEntry()
            })
          })
        })
      })
    })
  }

  async moveFiles(sources: string[], destDir: string): Promise<void[]> {
    await this.ensureDirectoryExists(destDir)
    return Promise.all(sources.map((fileName) => this.moveFile(fileName, path.join(destDir, path.basename(fileName)))))
  }

  async moveFile(source: PathLike, destination: PathLike): Promise<void> {
    try {
      await fs.promises.rename(source, destination)
    } catch (_error) {
      /** Fall back to copying and then deleting. */
      await fs.promises.copyFile(source, destination, fs.constants.COPYFILE_FICLONE_FORCE)
      await fs.promises.unlink(source)
    }
  }

  async deleteFileIfExists(filePath: PathLike): Promise<void> {
    try {
      await this.deleteFile(filePath)
    } catch {
      return
    }
  }

  async deleteFile(filePath: PathLike): Promise<void> {
    for (let i = 1, maxTries = 10; i < maxTries; i++) {
      try {
        await fs.promises.unlink(filePath)
        break
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        if (error.code === FileErrorCodes.OperationNotPermitted || error.code === FileErrorCodes.DeviceIsBusy) {
          await new Promise((resolve) => setTimeout(resolve, 300))
          continue
        } else if (error.code === FileErrorCodes.FileDoesNotExist) {
          /** Already deleted */
          break
        }
        throw error
      }
    }
  }
}

import { dialog } from 'electron'
import fs, { PathLike } from 'fs'
import { debounce } from 'lodash'
import path from 'path'
import yauzl from 'yauzl'
import { removeFromArray } from '../Utils/Utils'

export const FileDoesNotExist = 'ENOENT'
export const FileAlreadyExists = 'EEXIST'
const CrossDeviceLink = 'EXDEV'
const OperationNotPermitted = 'EPERM'
const DeviceIsBusy = 'EBUSY'

export function debouncedJSONDiskWriter(durationMs: number, location: string, data: () => unknown): () => void {
  let writingToDisk = false
  return debounce(async () => {
    if (writingToDisk) {
      return
    }
    writingToDisk = true
    try {
      await writeJSONFile(location, data())
    } catch (error) {
      console.error(error)
    } finally {
      writingToDisk = false
    }
  }, durationMs)
}

export async function openDirectoryPicker(): Promise<string | undefined> {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory', 'showHiddenFiles', 'createDirectory'],
  })

  return result.filePaths[0]
}

export async function readJSONFile<T>(filepath: string): Promise<T | undefined> {
  try {
    const data = await fs.promises.readFile(filepath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    return undefined
  }
}

export function readJSONFileSync<T>(filepath: string): T {
  const data = fs.readFileSync(filepath, 'utf8')
  return JSON.parse(data)
}

export async function writeJSONFile(filepath: string, data: unknown): Promise<void> {
  await ensureDirectoryExists(path.dirname(filepath))
  await fs.promises.writeFile(filepath, JSON.stringify(data, null, 2), 'utf8')
}

export async function writeFile(filepath: string, data: string): Promise<void> {
  await ensureDirectoryExists(path.dirname(filepath))
  await fs.promises.writeFile(filepath, data, 'utf8')
}

export function writeJSONFileSync(filepath: string, data: unknown): void {
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8')
}

export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    const stat = await fs.promises.lstat(dirPath)
    if (!stat.isDirectory()) {
      throw new Error('Tried to create a directory where a file of the same ' + `name already exists: ${dirPath}`)
    }
  } catch (error: any) {
    if (error.code === FileDoesNotExist) {
      /**
       * No directory here. Make sure there is a *parent* directory, and then
       * create it.
       */
      await ensureDirectoryExists(path.dirname(dirPath))

      /** Now that its parent(s) exist, create the directory */
      try {
        await fs.promises.mkdir(dirPath)
      } catch (error: any) {
        if (error.code === FileAlreadyExists) {
          /**
           * A concurrent process must have created the directory already.
           * Make sure it *is* a directory and not something else.
           */
          await ensureDirectoryExists(dirPath)
        } else {
          throw error
        }
      }
    } else {
      throw error
    }
  }
}

/**
 * Deletes a directory (handling recursion.)
 * @param {string} dirPath the path of the directory
 */
export async function deleteDir(dirPath: string): Promise<void> {
  try {
    await deleteDirContents(dirPath)
  } catch (error: any) {
    if (error.code === FileDoesNotExist) {
      /** Directory has already been deleted. */
      return
    }
    throw error
  }
  await fs.promises.rmdir(dirPath)
}

export async function deleteDirContents(dirPath: string): Promise<void> {
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
        await deleteDirContents(childPath)
        try {
          await fs.promises.rmdir(childPath)
        } catch (error) {
          if (error !== FileDoesNotExist) {
            throw error
          }
        }
      } else {
        await deleteFile(childPath)
      }
    }
  }
}

function isChildOfDir(parent: string, potentialChild: string) {
  const relative = path.relative(parent, potentialChild)
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative)
}

export async function moveDirContents(srcDir: string, destDir: string): Promise<void[]> {
  let fileNames = await fs.promises.readdir(srcDir)
  await ensureDirectoryExists(destDir)

  if (isChildOfDir(srcDir, destDir)) {
    fileNames = fileNames.filter((name) => {
      return !isChildOfDir(destDir, path.join(srcDir, name))
    })
    removeFromArray(fileNames, path.basename(destDir))
  }

  return moveFiles(
    fileNames.map((fileName) => path.join(srcDir, fileName)),
    destDir,
  )
}

export async function extractNestedZip(source: string, dest: string): Promise<void> {
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
        if (entry.fileName.endsWith('/')) {
          /** entry is a directory, skip and read next entry */
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
          const filepath = path.join(
            dest,
            /**
             * Remove the first element of the entry's path, which is the base
             * directory we want to ignore
             */
            entry.fileName.substring(entry.fileName.indexOf('/') + 1),
          )
          try {
            await ensureDirectoryExists(path.dirname(filepath))
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

export async function moveFiles(sources: string[], destDir: string): Promise<void[]> {
  await ensureDirectoryExists(destDir)
  return Promise.all(sources.map((fileName) => moveFile(fileName, path.join(destDir, path.basename(fileName)))))
}

async function moveFile(source: PathLike, destination: PathLike) {
  try {
    await fs.promises.rename(source, destination)
  } catch (error: any) {
    if (error.code === CrossDeviceLink) {
      /** Fall back to copying and then deleting. */
      await fs.promises.copyFile(source, destination)
      await fs.promises.unlink(source)
    } else {
      throw error
    }
  }
}

/** Deletes a file, handling EPERM and EBUSY errors on Windows. */
export async function deleteFile(filePath: PathLike): Promise<void> {
  for (let i = 1, maxTries = 10; i < maxTries; i++) {
    try {
      await fs.promises.unlink(filePath)
      break
    } catch (error: any) {
      if (error.code === OperationNotPermitted || error.code === DeviceIsBusy) {
        await new Promise((resolve) => setTimeout(resolve, 300))
        continue
      } else if (error.code === FileDoesNotExist) {
        /** Already deleted */
        break
      }
      throw error
    }
  }
}

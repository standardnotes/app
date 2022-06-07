import path from 'path'
import { deleteDir, ensureDirectoryExists } from '../app/javascripts/Main/Utils/FileUtils'

export function createTmpDir(name: string): {
  path: string
  make(): Promise<string>
  clean(): Promise<void>
} {
  const tmpDirPath = path.join(__dirname, 'data', 'tmp', path.basename(name))

  return {
    path: tmpDirPath,
    async make() {
      await ensureDirectoryExists(tmpDirPath)
      return tmpDirPath
    },
    async clean() {
      await deleteDir(tmpDirPath)
    },
  }
}

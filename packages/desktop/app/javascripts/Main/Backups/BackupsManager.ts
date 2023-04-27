import { dialog, shell, WebContents } from 'electron'
import { promises as fs } from 'fs'
import path from 'path'
import { AppMessageType, MessageType } from '../../../../test/TestIpcMessage'
import { AppState } from '../../../AppState'
import { MessageToWebApp } from '../../Shared/IpcMessages'
import { StoreKeys } from '../Store/StoreKeys'
import { backups as str } from '../Strings'
import { Paths } from '../Types/Paths'
import {
  deleteDir,
  deleteDirContents,
  ensureDirectoryExists,
  FileDoesNotExist,
  moveFiles,
  openDirectoryPicker,
} from '../Utils/FileUtils'
import { handleTestMessage, send } from '../Utils/Testing'
import { isTesting, last } from '../Utils/Utils'
import { BackupsManagerInterface } from './BackupsManagerInterface'

function log(...message: any) {
  // eslint-disable-next-line no-console
  console.log('BackupsManager:', ...message)
}

function logError(...message: any) {
  console.error('BackupsManager:', ...message)
}

export const enum EnsureRecentBackupExists {
  Success = 0,
  BackupsAreDisabled = 1,
  FailedToCreateBackup = 2,
}

export const BackupsDirectoryName = 'Standard Notes Backups'
const BackupFileExtension = '.txt'

export class BackupsManager implements BackupsManagerInterface {
  public backupsLocation: string
  private backupsDisabled: boolean
  private needsBackup = false
  private interval: NodeJS.Timeout | undefined

  constructor(private webContents: WebContents, private appState: AppState) {
    this.backupsLocation = appState.store.get(StoreKeys.BackupsLocation)
    this.backupsDisabled = appState.store.get(StoreKeys.BackupsDisabled)
    this.needsBackup = false

    if (!this.backupsDisabled) {
      void this.copyDecryptScript(this.backupsLocation)
    }

    this.determineLastBackupDate(this.backupsLocation)
      .then((date) => appState.setBackupCreationDate(date))
      .catch(console.error)

    if (isTesting()) {
      handleTestMessage(MessageType.DataArchive, (data: any) => this.saveBackupData(data))
      handleTestMessage(MessageType.BackupsAreEnabled, () => !this.backupsDisabled)
      handleTestMessage(MessageType.ToggleBackupsEnabled, this.toggleBackupsStatus)
      handleTestMessage(MessageType.BackupsLocation, () => this.backupsLocation)
      handleTestMessage(MessageType.PerformBackup, this.performBackup)
      handleTestMessage(MessageType.CopyDecryptScript, this.copyDecryptScript)
      handleTestMessage(MessageType.ChangeBackupsLocation, this.setBackupsLocation)
    }
  }

  backupFileNameToDate(string: string): number {
    string = path.basename(string, '.txt')
    const dateTimeDelimiter = string.indexOf('T')
    const date = string.slice(0, dateTimeDelimiter)

    const time = string.slice(dateTimeDelimiter + 1).replace(/-/g, ':')
    return Date.parse(date + 'T' + time)
  }

  dateToSafeFilename(date: Date) {
    return date.toISOString().replace(/:/g, '-')
  }

  async copyDecryptScript(location: string) {
    try {
      await ensureDirectoryExists(location)
      await fs.copyFile(Paths.decryptScript, path.join(location, path.basename(Paths.decryptScript)))
    } catch (error) {
      console.error(error)
    }
  }

  async setBackupsLocation(location: string) {
    const previousLocation = this.backupsLocation
    if (previousLocation === location) {
      return
    }

    const newLocation = path.join(location, BackupsDirectoryName)
    let previousLocationFiles = await fs.readdir(previousLocation)
    const backupFiles = previousLocationFiles
      .filter((fileName) => fileName.endsWith(BackupFileExtension))
      .map((fileName) => path.join(previousLocation, fileName))

    await moveFiles(backupFiles, newLocation)
    await this.copyDecryptScript(newLocation)

    previousLocationFiles = await fs.readdir(previousLocation)
    if (previousLocationFiles.length === 0 || previousLocationFiles[0] === path.basename(Paths.decryptScript)) {
      await deleteDir(previousLocation)
    }

    /** Wait for the operation to be successful before saving new location */
    this.backupsLocation = newLocation
    this.appState.store.set(StoreKeys.BackupsLocation, this.backupsLocation)
  }

  async saveBackupData(data: any) {
    if (this.backupsDisabled) {
      return
    }

    let success: boolean
    let name: string | undefined

    try {
      name = await this.writeDataToFile(data)
      log(`Data backup successfully saved: ${name}`)
      success = true
      this.appState.setBackupCreationDate(Date.now())
    } catch (err) {
      success = false
      logError('An error occurred saving backup file', err)
    }

    this.webContents.send(MessageToWebApp.FinishedSavingBackup, { success })

    if (isTesting()) {
      send(AppMessageType.SavedBackup)
    }

    return name
  }

  performBackup() {
    if (this.backupsDisabled) {
      return
    }

    this.webContents.send(MessageToWebApp.PerformAutomatedBackup)
  }

  async writeDataToFile(data: any): Promise<string> {
    await ensureDirectoryExists(this.backupsLocation)

    const name = this.dateToSafeFilename(new Date()) + BackupFileExtension
    const filePath = path.join(this.backupsLocation, name)
    await fs.writeFile(filePath, data)
    return name
  }

  beginBackups() {
    if (this.interval) {
      clearInterval(this.interval)
    }

    this.needsBackup = true
    const hoursInterval = 12
    const seconds = hoursInterval * 60 * 60
    const milliseconds = seconds * 1000
    this.interval = setInterval(this.performBackup, milliseconds)
  }

  toggleBackupsStatus() {
    this.backupsDisabled = !this.backupsDisabled
    this.appState.store.set(StoreKeys.BackupsDisabled, this.backupsDisabled)
    /** Create a backup on reactivation. */
    if (!this.backupsDisabled) {
      this.performBackup()
    }
  }

  get backupsAreEnabled() {
    return !this.backupsDisabled
  }

  async backupsCount(): Promise<number> {
    let files = await fs.readdir(this.backupsLocation)
    files = files.filter((fileName) => fileName.endsWith(BackupFileExtension))
    return files.length
  }
  applicationDidBlur() {
    if (this.needsBackup) {
      this.needsBackup = false
      this.performBackup()
    }
  }
  viewBackups() {
    void shell.openPath(this.backupsLocation)
  }
  async deleteBackups() {
    await deleteDirContents(this.backupsLocation)
    return this.copyDecryptScript(this.backupsLocation)
  }

  async changeBackupsLocation() {
    const path = await openDirectoryPicker()

    if (!path) {
      return
    }

    try {
      await this.setBackupsLocation(path)
      this.performBackup()
    } catch (e) {
      logError(e)
      void dialog.showMessageBox({
        message: str().errorChangingDirectory(e),
      })
    }
  }

  async determineLastBackupDate(backupsLocation: string): Promise<number | null> {
    try {
      const files = (await fs.readdir(backupsLocation))
        .filter(
          (filename) => filename.endsWith(BackupFileExtension) && !Number.isNaN(this.backupFileNameToDate(filename)),
        )
        .sort()
      const lastBackupFileName = last(files)
      if (!lastBackupFileName) {
        return null
      }
      const backupDate = this.backupFileNameToDate(lastBackupFileName)
      if (Number.isNaN(backupDate)) {
        return null
      }
      return backupDate
    } catch (error: any) {
      if (error.code !== FileDoesNotExist) {
        console.error(error)
      }
      return null
    }
  }
}

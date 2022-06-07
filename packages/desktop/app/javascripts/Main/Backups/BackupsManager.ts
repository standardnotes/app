import { dialog, WebContents, shell } from 'electron'
import { promises as fs } from 'fs'
import path from 'path'
import { AppMessageType, MessageType } from '../../../../test/TestIpcMessage'
import { AppState } from '../../../application'
import { MessageToWebApp } from '../../Shared/IpcMessages'
import { BackupsManagerInterface } from './BackupsManagerInterface'
import {
  deleteDir,
  deleteDirContents,
  ensureDirectoryExists,
  FileDoesNotExist,
  moveFiles,
  openDirectoryPicker,
} from '../Utils/FileUtils'
import { Paths } from '../Types/Paths'
import { StoreKeys } from '../Store'
import { backups as str } from '../Strings'
import { handleTestMessage, send } from '../Utils/Testing'
import { isTesting, last } from '../Utils/Utils'

function log(...message: any) {
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

function backupFileNameToDate(string: string): number {
  string = path.basename(string, '.txt')
  const dateTimeDelimiter = string.indexOf('T')
  const date = string.slice(0, dateTimeDelimiter)

  const time = string.slice(dateTimeDelimiter + 1).replace(/-/g, ':')
  return Date.parse(date + 'T' + time)
}

function dateToSafeFilename(date: Date) {
  return date.toISOString().replace(/:/g, '-')
}

async function copyDecryptScript(location: string) {
  try {
    await ensureDirectoryExists(location)
    await fs.copyFile(Paths.decryptScript, path.join(location, path.basename(Paths.decryptScript)))
  } catch (error) {
    console.error(error)
  }
}

export function createBackupsManager(webContents: WebContents, appState: AppState): BackupsManagerInterface {
  let backupsLocation = appState.store.get(StoreKeys.BackupsLocation)
  let backupsDisabled = appState.store.get(StoreKeys.BackupsDisabled)
  let needsBackup = false

  if (!backupsDisabled) {
    void copyDecryptScript(backupsLocation)
  }

  determineLastBackupDate(backupsLocation)
    .then((date) => appState.setBackupCreationDate(date))
    .catch(console.error)

  async function setBackupsLocation(location: string) {
    const previousLocation = backupsLocation
    if (previousLocation === location) {
      return
    }

    const newLocation = path.join(location, BackupsDirectoryName)
    let previousLocationFiles = await fs.readdir(previousLocation)
    const backupFiles = previousLocationFiles
      .filter((fileName) => fileName.endsWith(BackupFileExtension))
      .map((fileName) => path.join(previousLocation, fileName))

    await moveFiles(backupFiles, newLocation)
    await copyDecryptScript(newLocation)

    previousLocationFiles = await fs.readdir(previousLocation)
    if (previousLocationFiles.length === 0 || previousLocationFiles[0] === path.basename(Paths.decryptScript)) {
      await deleteDir(previousLocation)
    }

    /** Wait for the operation to be successful before saving new location */
    backupsLocation = newLocation
    appState.store.set(StoreKeys.BackupsLocation, backupsLocation)
  }

  async function saveBackupData(data: any) {
    if (backupsDisabled) {
      return
    }

    let success: boolean
    let name: string | undefined

    try {
      name = await writeDataToFile(data)
      log(`Data backup successfully saved: ${name}`)
      success = true
      appState.setBackupCreationDate(Date.now())
    } catch (err) {
      success = false
      logError('An error occurred saving backup file', err)
    }

    webContents.send(MessageToWebApp.FinishedSavingBackup, { success })

    if (isTesting()) {
      send(AppMessageType.SavedBackup)
    }

    return name
  }

  function performBackup() {
    if (backupsDisabled) {
      return
    }

    webContents.send(MessageToWebApp.PerformAutomatedBackup)
  }

  async function writeDataToFile(data: any): Promise<string> {
    await ensureDirectoryExists(backupsLocation)

    const name = dateToSafeFilename(new Date()) + BackupFileExtension
    const filePath = path.join(backupsLocation, name)
    await fs.writeFile(filePath, data)
    return name
  }

  let interval: NodeJS.Timeout | undefined
  function beginBackups() {
    if (interval) {
      clearInterval(interval)
    }

    needsBackup = true
    const hoursInterval = 12
    const seconds = hoursInterval * 60 * 60
    const milliseconds = seconds * 1000
    interval = setInterval(performBackup, milliseconds)
  }

  function toggleBackupsStatus() {
    backupsDisabled = !backupsDisabled
    appState.store.set(StoreKeys.BackupsDisabled, backupsDisabled)
    /** Create a backup on reactivation. */
    if (!backupsDisabled) {
      performBackup()
    }
  }

  if (isTesting()) {
    handleTestMessage(MessageType.DataArchive, (data: any) => saveBackupData(data))
    handleTestMessage(MessageType.BackupsAreEnabled, () => !backupsDisabled)
    handleTestMessage(MessageType.ToggleBackupsEnabled, toggleBackupsStatus)
    handleTestMessage(MessageType.BackupsLocation, () => backupsLocation)
    handleTestMessage(MessageType.PerformBackup, performBackup)
    handleTestMessage(MessageType.CopyDecryptScript, copyDecryptScript)
    handleTestMessage(MessageType.ChangeBackupsLocation, setBackupsLocation)
  }

  return {
    get backupsAreEnabled() {
      return !backupsDisabled
    },
    get backupsLocation() {
      return backupsLocation
    },
    saveBackupData,
    performBackup,
    beginBackups,
    toggleBackupsStatus,
    async backupsCount(): Promise<number> {
      let files = await fs.readdir(backupsLocation)
      files = files.filter((fileName) => fileName.endsWith(BackupFileExtension))
      return files.length
    },
    applicationDidBlur() {
      if (needsBackup) {
        needsBackup = false
        performBackup()
      }
    },
    viewBackups() {
      void shell.openPath(backupsLocation)
    },
    async deleteBackups() {
      await deleteDirContents(backupsLocation)
      return copyDecryptScript(backupsLocation)
    },

    async changeBackupsLocation() {
      const path = await openDirectoryPicker()

      if (!path) {
        return
      }

      try {
        await setBackupsLocation(path)
        performBackup()
      } catch (e) {
        logError(e)
        void dialog.showMessageBox({
          message: str().errorChangingDirectory(e),
        })
      }
    },
  }
}

async function determineLastBackupDate(backupsLocation: string): Promise<number | null> {
  try {
    const files = (await fs.readdir(backupsLocation))
      .filter((filename) => filename.endsWith(BackupFileExtension) && !Number.isNaN(backupFileNameToDate(filename)))
      .sort()
    const lastBackupFileName = last(files)
    if (!lastBackupFileName) {
      return null
    }
    const backupDate = backupFileNameToDate(lastBackupFileName)
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

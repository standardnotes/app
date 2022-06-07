import compareVersions from 'compare-versions'
import { BrowserWindow, dialog, shell } from 'electron'
import electronLog from 'electron-log'
import { autoUpdater } from 'electron-updater'
import { action, autorun, computed, makeObservable, observable } from 'mobx'
import { autoUpdatingAvailable } from './Types/Constants'
import { MessageType } from '../../../test/TestIpcMessage'
import { AppState } from '../../application'
import { BackupsManagerInterface } from './Backups/BackupsManagerInterface'
import { StoreKeys } from './Store'
import { updates as str } from './Strings'
import { handleTestMessage } from './Utils/Testing'
import { isTesting } from './Utils/Utils'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function logError(...message: any) {
  console.error('updateManager:', ...message)
}

if (isTesting()) {
  // eslint-disable-next-line no-var
  var notifiedStateUpdate = false
}

export class UpdateState {
  latestVersion: string | null = null
  enableAutoUpdate: boolean
  checkingForUpdate = false
  autoUpdateDownloaded = false
  lastCheck: Date | null = null

  constructor(private appState: AppState) {
    this.enableAutoUpdate = autoUpdatingAvailable && appState.store.get(StoreKeys.EnableAutoUpdate)
    makeObservable(this, {
      latestVersion: observable,
      enableAutoUpdate: observable,
      checkingForUpdate: observable,
      autoUpdateDownloaded: observable,
      lastCheck: observable,

      updateNeeded: computed,

      toggleAutoUpdate: action,
      setCheckingForUpdate: action,
      autoUpdateHasBeenDownloaded: action,
      checkedForUpdate: action,
    })

    if (isTesting()) {
      handleTestMessage(MessageType.UpdateState, () => ({
        lastCheck: this.lastCheck,
      }))
    }
  }

  get updateNeeded(): boolean {
    if (this.latestVersion) {
      return compareVersions(this.latestVersion, this.appState.version) === 1
    } else {
      return false
    }
  }

  toggleAutoUpdate(): void {
    this.enableAutoUpdate = !this.enableAutoUpdate
    this.appState.store.set(StoreKeys.EnableAutoUpdate, this.enableAutoUpdate)
  }

  setCheckingForUpdate(checking: boolean): void {
    this.checkingForUpdate = checking
  }

  autoUpdateHasBeenDownloaded(version: string | null): void {
    this.autoUpdateDownloaded = true
    this.latestVersion = version
  }

  checkedForUpdate(latestVersion: string | null): void {
    this.lastCheck = new Date()
    this.latestVersion = latestVersion
  }
}

let updatesSetup = false

export function setupUpdates(window: BrowserWindow, appState: AppState, backupsManager: BackupsManagerInterface): void {
  if (!autoUpdatingAvailable) {
    return
  }
  if (updatesSetup) {
    throw Error('Already set up updates.')
  }
  const { store } = appState

  autoUpdater.logger = electronLog

  const updateState = appState.updates

  function checkUpdateSafety(): boolean {
    let canUpdate: boolean
    if (appState.store.get(StoreKeys.BackupsDisabled)) {
      canUpdate = true
    } else {
      canUpdate = updateState.enableAutoUpdate && isLessThanOneHourFromNow(appState.lastBackupDate)
    }
    autoUpdater.autoInstallOnAppQuit = canUpdate
    autoUpdater.autoDownload = canUpdate
    return canUpdate
  }
  autorun(checkUpdateSafety)

  const oneHour = 1 * 60 * 60 * 1000
  setInterval(checkUpdateSafety, oneHour)

  autoUpdater.on('update-downloaded', (info: { version?: string }) => {
    window.webContents.send('update-available', null)
    updateState.autoUpdateHasBeenDownloaded(info.version || null)
  })

  autoUpdater.on('error', logError)
  autoUpdater.on('update-available', (info: { version?: string }) => {
    updateState.checkedForUpdate(info.version || null)
    if (updateState.enableAutoUpdate) {
      const canUpdate = checkUpdateSafety()
      if (!canUpdate) {
        backupsManager.performBackup()
      }
    }
  })
  autoUpdater.on('update-not-available', (info: { version?: string }) => {
    updateState.checkedForUpdate(info.version || null)
  })

  updatesSetup = true

  if (isTesting()) {
    handleTestMessage(MessageType.AutoUpdateEnabled, () => store.get(StoreKeys.EnableAutoUpdate))
    handleTestMessage(MessageType.CheckForUpdate, () => checkForUpdate(appState, updateState))
    // eslint-disable-next-line block-scoped-var
    handleTestMessage(MessageType.UpdateManagerNotifiedStateChange, () => notifiedStateUpdate)
  } else {
    void checkForUpdate(appState, updateState)
  }
}

export function openChangelog(state: UpdateState): void {
  const url = 'https://github.com/standardnotes/desktop/releases'
  if (state.latestVersion) {
    void shell.openExternal(`${url}/tag/v${state.latestVersion}`)
  } else {
    void shell.openExternal(url)
  }
}

function quitAndInstall(window: BrowserWindow) {
  setTimeout(() => {
    // index.js prevents close event on some platforms
    window.removeAllListeners('close')
    window.close()
    autoUpdater.quitAndInstall(false)
  }, 0)
}

function isLessThanOneHourFromNow(date: number | null) {
  const now = Date.now()
  const onHourMs = 1 * 60 * 60 * 1000
  return now - (date ?? 0) < onHourMs
}

export async function showUpdateInstallationDialog(parentWindow: BrowserWindow, appState: AppState): Promise<void> {
  if (!appState.updates.latestVersion) {
    return
  }

  if (appState.lastBackupDate && isLessThanOneHourFromNow(appState.lastBackupDate)) {
    const result = await dialog.showMessageBox(parentWindow, {
      type: 'info',
      title: str().updateReady.title,
      message: str().updateReady.message(appState.updates.latestVersion),
      buttons: [str().updateReady.installLater, str().updateReady.quitAndInstall],
      cancelId: 0,
    })

    const buttonIndex = result.response
    if (buttonIndex === 1) {
      quitAndInstall(parentWindow)
    }
  } else {
    const cancelId = 0
    const result = await dialog.showMessageBox({
      type: 'warning',
      title: str().updateReady.title,
      message: str().updateReady.noRecentBackupMessage,
      detail: str().updateReady.noRecentBackupDetail(appState.lastBackupDate),
      checkboxLabel: str().updateReady.noRecentBackupChecbox,
      checkboxChecked: false,
      buttons: [str().updateReady.installLater, str().updateReady.quitAndInstall],
      cancelId,
    })

    if (!result.checkboxChecked || result.response === cancelId) {
      return
    }
    quitAndInstall(parentWindow)
  }
}

export async function checkForUpdate(appState: AppState, state: UpdateState, userTriggered = false): Promise<void> {
  if (!autoUpdatingAvailable) {
    return
  }

  if (state.enableAutoUpdate || userTriggered) {
    state.setCheckingForUpdate(true)

    try {
      const result = await autoUpdater.checkForUpdates()

      if (!result) {
        return
      }

      state.checkedForUpdate(result.updateInfo.version)

      if (userTriggered) {
        let message
        if (state.updateNeeded && state.latestVersion) {
          message = str().finishedChecking.updateAvailable(state.latestVersion)
        } else {
          message = str().finishedChecking.noUpdateAvailable(appState.version)
        }

        void dialog.showMessageBox({
          title: str().finishedChecking.title,
          message,
        })
      }
    } catch (error) {
      if (userTriggered) {
        void dialog.showMessageBox({
          title: str().finishedChecking.title,
          message: str().finishedChecking.error(JSON.stringify(error)),
        })
      }
    } finally {
      state.setCheckingForUpdate(false)
    }
  }
}

import { compareVersions } from 'compare-versions'
import { BrowserWindow, dialog, shell } from 'electron'
import electronLog from 'electron-log'
import { autoUpdater } from 'electron-updater'
import { action, computed, makeObservable, observable } from 'mobx'
import { MessageType } from '../../../test/TestIpcMessage'
import { AppState } from '../../AppState'
import { MessageToWebApp } from '../Shared/IpcMessages'
import { StoreKeys } from './Store/StoreKeys'
import { updates as str } from './Strings'
import { autoUpdatingAvailable } from './Types/Constants'
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

export function setupUpdates(window: BrowserWindow, appState: AppState): void {
  if (!autoUpdatingAvailable) {
    return
  }
  if (updatesSetup) {
    throw Error('Already set up updates.')
  }
  const { store } = appState

  autoUpdater.logger = electronLog

  const updateState = appState.updates

  autoUpdater.on('update-downloaded', (info: { version?: string }) => {
    window.webContents.send(MessageToWebApp.UpdateAvailable, null)
    updateState.autoUpdateHasBeenDownloaded(info.version || null)
  })

  autoUpdater.on('error', logError)
  autoUpdater.on(MessageToWebApp.UpdateAvailable, (info: { version?: string }) => {
    updateState.checkedForUpdate(info.version || null)
    if (updateState.enableAutoUpdate) {
      const canUpdate = updateState.enableAutoUpdate
      autoUpdater.autoInstallOnAppQuit = canUpdate
      autoUpdater.autoDownload = canUpdate
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
  const url = 'https://github.com/standardnotes/app/releases'
  const latestVersion = state.latestVersion
  if (latestVersion) {
    const tagPath = `tag/%40standardnotes%2Fdesktop%40${latestVersion}`
    void shell.openExternal(`${url}/${tagPath}`)
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

export async function showUpdateInstallationDialog(parentWindow: BrowserWindow, appState: AppState): Promise<void> {
  if (!appState.updates.latestVersion) {
    return
  }

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
}

export async function checkForUpdate(appState: AppState, state: UpdateState, userTriggered = false): Promise<void> {
  if (!autoUpdatingAvailable) {
    return
  }

  if (state.enableAutoUpdate || userTriggered) {
    state.setCheckingForUpdate(true)

    try {
      const result = userTriggered ? await autoUpdater.checkForUpdatesAndNotify() : await autoUpdater.checkForUpdates()

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

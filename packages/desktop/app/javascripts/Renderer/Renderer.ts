import {
  DesktopClientRequiresWebMethods,
  DesktopWatchedDirectoriesChanges,
} from '@web/Application/Device/DesktopSnjsExports'
import { StartApplication } from '@web/Application/Device/StartApplication'
import { IpcRendererEvent } from 'electron/renderer'
import { CrossProcessBridge } from './CrossProcessBridge'
import { DesktopDevice } from './DesktopDevice'
import { ElectronMainEvents } from '../Shared/ElectronMainEvents'

declare const DEFAULT_SYNC_SERVER: string
declare const WEBSOCKET_URL: string
declare const ENABLE_UNFINISHED_FEATURES: string
declare const PURCHASE_URL: string
declare const PLANS_URL: string
declare const DASHBOARD_URL: string

declare global {
  interface Window {
    device: DesktopDevice
    electronRemoteBridge: CrossProcessBridge
    dashboardUrl: string
    webClient: DesktopClientRequiresWebMethods
    electronAppVersion: string
    enableUnfinishedFeatures: boolean
    plansUrl: string
    purchaseUrl: string
    startApplication: StartApplication
    zip: unknown
    electronMainEvents: ElectronMainEvents
  }
}

const loadWindowVarsRequiredByWebApp = () => {
  window.dashboardUrl = DASHBOARD_URL
  window.enableUnfinishedFeatures = ENABLE_UNFINISHED_FEATURES === 'true'
  window.plansUrl = PLANS_URL
  window.purchaseUrl = PURCHASE_URL
}

const loadAndStartApplication = async () => {
  const remoteBridge: CrossProcessBridge = window.electronRemoteBridge

  await configureWindow(remoteBridge)

  window.device = await createDesktopDevice(remoteBridge)

  return window.startApplication(DEFAULT_SYNC_SERVER, window.device, window.enableUnfinishedFeatures, WEBSOCKET_URL)
}

window.onload = () => {
  loadWindowVarsRequiredByWebApp()

  void loadAndStartApplication()
}

window.onunload = () => {
  if (window.device) {
    void window.device.stopHomeServer()
  }
}

/** @returns whether the keychain structure is up to date or not */
async function migrateKeychain(remoteBridge: CrossProcessBridge): Promise<boolean> {
  if (!remoteBridge.useNativeKeychain) {
    /** User chose not to use keychain, do not migrate. */
    return false
  }

  const key = 'keychain'
  const localStorageValue = window.localStorage.getItem(key)

  if (localStorageValue) {
    /** Migrate to native keychain */
    console.warn('Migrating keychain from localStorage to native keychain.')
    window.localStorage.removeItem(key)
    await remoteBridge.setKeychainValue(JSON.parse(localStorageValue))
  }

  return true
}

async function createDesktopDevice(remoteBridge: CrossProcessBridge): Promise<DesktopDevice> {
  const useNativeKeychain = await migrateKeychain(remoteBridge)
  const extensionsServerHost = remoteBridge.extServerHost
  const appVersion = remoteBridge.appVersion

  return new DesktopDevice(remoteBridge, useNativeKeychain, extensionsServerHost, appVersion)
}

async function configureWindow(remoteBridge: CrossProcessBridge) {
  const isMacOS = remoteBridge.isMacOS
  const useSystemMenuBar = remoteBridge.useSystemMenuBar
  const appVersion = remoteBridge.appVersion

  window.electronAppVersion = appVersion

  /*
  Title bar events
  */
  document.getElementById('menu-btn')?.addEventListener('click', () => {
    remoteBridge.displayAppMenu()
  })

  document.getElementById('min-btn')?.addEventListener('click', () => {
    remoteBridge.minimizeWindow()
  })

  document.getElementById('max-btn')?.addEventListener('click', async () => {
    if (remoteBridge.isWindowMaximized()) {
      remoteBridge.unmaximizeWindow()
    } else {
      remoteBridge.maximizeWindow()
    }
  })

  document.getElementById('close-btn')?.addEventListener('click', () => {
    remoteBridge.closeWindow()
  })

  // For Mac inset window
  const sheet = document.styleSheets[0]

  if (isMacOS || useSystemMenuBar) {
    // !important is important here because #desktop-title-bar has display: flex.
    sheet.insertRule('#desktop-title-bar { display: none !important; }', sheet.cssRules.length)
  } else {
    /* Use custom title bar. Take the sn-titlebar-height off of
    the app content height so its not overflowing */
    sheet.insertRule(
      '[role="dialog"]:not(.challenge-modal) { max-height: calc(100vh - var(--sn-desktop-titlebar-height)) !important; margin-top: var(--sn-desktop-titlebar-height); }',
      sheet.cssRules.length,
    )
    sheet.insertRule(
      '[data-mobile-popover] { padding-top: var(--sn-desktop-titlebar-height) !important; }',
      sheet.cssRules.length,
    )
  }
}

window.electronMainEvents.setUpdateAvailableHandler(() => {
  window.webClient.updateAvailable()
})

window.electronMainEvents.setWindowBlurredHandler(() => {
  window.webClient.windowLostFocus()
})

window.electronMainEvents.setWindowFocusedHandler(() => {
  window.webClient.windowGainedFocus()
})

window.electronMainEvents.setConsoleLogHandler((_: IpcRendererEvent, message: unknown) => {
  window.webClient.consoleLog(message as string)
})

window.electronMainEvents.setInstallComponentCompleteHandler((_: IpcRendererEvent, data: unknown) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  void window.webClient.onComponentInstallationComplete((data as any).component, undefined)
})

window.electronMainEvents.setWatchedDirectoriesChangeHandler((_: IpcRendererEvent, changes: unknown) => {
  void window.webClient.handleWatchedDirectoriesChanges(changes as DesktopWatchedDirectoriesChanges)
})

window.electronMainEvents.setHomeServerStartedHandler((_: IpcRendererEvent, serverUrl: unknown) => {
  void window.webClient.handleHomeServerStarted(serverUrl as string)
})

import { DesktopClientRequiresWebMethods } from '@web/Application/Device/DesktopSnjsExports'
import { StartApplication } from '@web/Application/Device/StartApplication'
import { IpcRendererEvent } from 'electron/renderer'
import { CrossProcessBridge } from './CrossProcessBridge'
import { DesktopDevice } from './DesktopDevice'

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
    zip: any
    electronMainEvents: any
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

  window.startApplication(DEFAULT_SYNC_SERVER, window.device, window.enableUnfinishedFeatures, WEBSOCKET_URL)
}

window.onload = () => {
  loadWindowVarsRequiredByWebApp()

  void loadAndStartApplication()
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
  document.getElementById('menu-btn')!.addEventListener('click', () => {
    remoteBridge.displayAppMenu()
  })

  document.getElementById('min-btn')!.addEventListener('click', () => {
    remoteBridge.minimizeWindow()
  })

  document.getElementById('max-btn')!.addEventListener('click', async () => {
    if (remoteBridge.isWindowMaximized()) {
      remoteBridge.unmaximizeWindow()
    } else {
      remoteBridge.maximizeWindow()
    }
  })

  document.getElementById('close-btn')!.addEventListener('click', () => {
    remoteBridge.closeWindow()
  })

  // For Mac inset window
  const sheet = document.styleSheets[0]
  if (isMacOS) {
    sheet.insertRule('#navigation { padding-top: 25px !important; }', sheet.cssRules.length)
  }

  if (isMacOS || useSystemMenuBar) {
    // !important is important here because #desktop-title-bar has display: flex.
    sheet.insertRule('#desktop-title-bar { display: none !important; }', sheet.cssRules.length)
  } else {
    /* Use custom title bar. Take the sn-titlebar-height off of
    the app content height so its not overflowing */
    sheet.insertRule('body { padding-top: var(--sn-desktop-titlebar-height); }', sheet.cssRules.length)
    sheet.insertRule(
      '[data-popover] { padding-top: calc(var(--sn-desktop-titlebar-height) + 0.5rem); }',
      sheet.cssRules.length,
    )
    sheet.insertRule(
      `.main-ui-view { height: calc(100vh - var(--sn-desktop-titlebar-height)) !important;
        min-height: calc(100vh - var(--sn-desktop-titlebar-height)) !important; }`,
      sheet.cssRules.length,
    )
  }
}

window.electronMainEvents.handleUpdateAvailable((event: IpcRendererEvent, data: any) => {
  window.webClient.updateAvailable()
})

window.electronMainEvents.handlePerformAutomatedBackup((event: IpcRendererEvent, data: any) => {
  void window.device.downloadBackup()
})

window.electronMainEvents.handleFinishedSavingBackup((event: IpcRendererEvent, data: any) => {
  window.webClient.didFinishBackup(data.success)
})

window.electronMainEvents.handleWindowBlurred((event: IpcRendererEvent, data: any) => {
  window.webClient.windowLostFocus()
})

window.electronMainEvents.handleWindowFocused((event: IpcRendererEvent, data: any) => {
  window.webClient.windowGainedFocus()
})

window.electronMainEvents.handleInstallComponentComplete((event: IpcRendererEvent, data: any) => {
  window.webClient.onComponentInstallationComplete(data.component, undefined)
})

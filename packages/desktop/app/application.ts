import { App, Shell, Event } from 'electron'
import { AppState } from './AppState'
import { createExtensionsServer } from './javascripts/Main/ExtensionsServer'
import { Keychain } from './javascripts/Main/Keychain/Keychain'
import { StoreKeys } from './javascripts/Main/Store/StoreKeys'
import { AppName, initializeStrings } from './javascripts/Main/Strings'
import { isLinux, isMac, isWindows } from './javascripts/Main/Types/Platforms'
import { isDev } from './javascripts/Main/Utils/Utils'
import { createWindowState } from './javascripts/Main/Window'

const deepLinkScheme = 'standardnotes'

export function initializeApplication(args: { app: Electron.App; ipcMain: Electron.IpcMain; shell: Shell }): void {
  const { app } = args

  app.name = AppName

  const state = new AppState(app)

  void setupDeepLinking(app)

  registerSingleInstanceHandler(app, state)

  registerAppEventListeners({
    ...args,
    state,
  })

  if (isDev()) {
    /** Expose the app's state as a global variable. Useful for debugging */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global as any).appState = state

    setTimeout(() => {
      state.windowState?.window.webContents.openDevTools()
    }, 500)
  }
}

function focusWindow(appState: AppState) {
  const window = appState.windowState?.window

  if (window) {
    if (!window.isVisible()) {
      window.show()
    }
    if (window.isMinimized()) {
      window.restore()
    }
    window.focus()
  }
}

function registerSingleInstanceHandler(app: Electron.App, appState: AppState) {
  app.on('second-instance', (_event: Event, argv: string[], _workingDirectory: string, _additionalData: unknown) => {
    if (isWindows()) {
      appState.deepLinkUrl = argv.find((arg) => arg.startsWith(deepLinkScheme))
    }

    /* Someone tried to run a second instance, we should focus our window. */
    focusWindow(appState)
  })
}

function registerAppEventListeners(args: {
  app: Electron.App
  ipcMain: Electron.IpcMain
  shell: Shell
  state: AppState
}) {
  const { app, state } = args

  app.on('window-all-closed', () => {
    if (!isMac()) {
      app.quit()
    }
  })

  app.on('before-quit', () => {
    state.willQuitApp = true
  })

  app.on('activate', () => {
    const windowState = state.windowState
    if (!windowState) {
      return
    }
    windowState.window.show()
  })

  app.on('open-url', (_event, url) => {
    state.deepLinkUrl = url
    focusWindow(state)
  })

  app.on('ready', () => {
    if (!state.isPrimaryInstance) {
      console.warn('Quiting app and focusing existing instance.')
      app.quit()
      return
    }

    void finishApplicationInitialization(args)
  })
}

async function setupDeepLinking(app: Electron.App) {
  if (!app.isDefaultProtocolClient(deepLinkScheme)) {
    app.setAsDefaultProtocolClient(deepLinkScheme)
  }
}

async function finishApplicationInitialization({ app, shell, state }: { app: App; shell: Shell; state: AppState }) {
  const keychainWindow = await Keychain.ensureKeychainAccess(state.store)

  initializeStrings(app.getLocale())

  const windowState = await createWindowState({
    shell,
    appState: state,
    appLocale: app.getLocale(),
    teardown() {
      state.windowState = undefined
    },
  })

  if (state.isRunningVersionForFirstTime()) {
    await windowState.window.webContents.session.clearCache()
  }

  const host = createExtensionsServer()
  state.store.set(StoreKeys.ExtServerHost, host)

  /**
   * Close the keychain window after the main window is created, otherwise the
   * app will quit automatically
   */
  keychainWindow?.close()

  state.windowState = windowState

  if ((isWindows() || isLinux()) && state.windowState.trayManager.shouldMinimizeToTray()) {
    state.windowState.trayManager.createTrayIcon()
  }

  void windowState.window.loadURL(state.startUrl)
}

import { App, Shell } from 'electron'
import { action, makeObservable, observable } from 'mobx'
import { MessageType } from '../test/TestIpcMessage'
import { createExtensionsServer } from './javascripts/Main/ExtensionsServer'
import { Keychain } from './javascripts/Main/Keychain/Keychain'
import { Store, StoreKeys } from './javascripts/Main/Store'
import { AppName, initializeStrings } from './javascripts/Main/Strings'
import { Paths, Urls } from './javascripts/Main/Types/Paths'
import { isLinux, isMac, isWindows } from './javascripts/Main/Types/Platforms'
import { UpdateState } from './javascripts/Main/UpdateManager'
import { handleTestMessage } from './javascripts/Main/Utils/Testing'
import { isDev, isTesting } from './javascripts/Main/Utils/Utils'
import { createWindowState, WindowState } from './javascripts/Main/Window'

const deepLinkScheme = 'standardnotes'

export class AppState {
  readonly version: string
  readonly store: Store
  readonly startUrl = Urls.indexHtml
  readonly isPrimaryInstance: boolean
  public willQuitApp = false
  public lastBackupDate: number | null = null
  public windowState?: WindowState
  public deepLinkUrl?: string
  public readonly updates: UpdateState

  constructor(app: Electron.App) {
    this.version = app.getVersion()
    this.store = new Store(Paths.userDataDir)
    this.isPrimaryInstance = app.requestSingleInstanceLock()
    makeObservable(this, {
      lastBackupDate: observable,
      setBackupCreationDate: action,
    })
    this.updates = new UpdateState(this)

    if (isTesting()) {
      handleTestMessage(MessageType.AppStateCall, (method, ...args) => {
        ;(this as any)[method](...args)
      })
    }
  }

  setBackupCreationDate(date: number | null): void {
    this.lastBackupDate = date
  }
}

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
    ;(global as any).appState = state
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
  app.on('second-instance', (_event: Event, argv: string[]) => {
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
  initializeExtensionsServer(state.store)

  const windowState = await createWindowState({
    shell,
    appState: state,
    appLocale: app.getLocale(),
    teardown() {
      state.windowState = undefined
    },
  })

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

function initializeExtensionsServer(store: Store) {
  const host = createExtensionsServer()

  store.set(StoreKeys.ExtServerHost, host)
}

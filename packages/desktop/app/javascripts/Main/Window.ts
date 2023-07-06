import { clearSensitiveDirectories } from '@standardnotes/electron-clear-data'
import { BrowserWindow, Rectangle, screen, Shell } from 'electron'
import fs from 'fs'
import { debounce } from 'lodash'
import path from 'path'
import { AppMessageType, MessageType } from '../../../test/TestIpcMessage'
import { AppState } from '../../AppState'
import { MessageToWebApp } from '../Shared/IpcMessages'
import { FilesBackupManager } from './FileBackups/FileBackupsManager'
import { Keychain } from './Keychain/Keychain'
import { MediaManager } from './Media/MediaManager'
import { MenuManagerInterface } from './Menus/MenuManagerInterface'
import { buildContextMenu, createMenuManager } from './Menus/Menus'
import { initializePackageManager } from './Packages/PackageManager'
import { RemoteBridge } from './Remote/RemoteBridge'
import { initializeSearchManager } from './Search/SearchManager'
import { createSpellcheckerManager } from './SpellcheckerManager'
import { Store } from './Store/Store'
import { StoreKeys } from './Store/StoreKeys'
import { createTrayManager, TrayManager } from './TrayManager'
import { Paths } from './Types/Paths'
import { isMac, isWindows } from './Types/Platforms'
import { checkForUpdate, setupUpdates } from './UpdateManager'
import { handleTestMessage, send } from './Utils/Testing'
import { isTesting, lowercaseDriveLetter } from './Utils/Utils'
import { initializeZoomManager } from './ZoomManager'
import { HomeServerManager } from './HomeServer/HomeServerManager'
import { FilesManager } from './File/FilesManager'
import { DirectoryManager } from './Directory/DirectoryManager'

const WINDOW_DEFAULT_WIDTH = 1100
const WINDOW_DEFAULT_HEIGHT = 800
const WINDOW_MIN_WIDTH = 300
const WINDOW_MIN_HEIGHT = 400

export interface WindowState {
  window: Electron.BrowserWindow
  menuManager: MenuManagerInterface
  trayManager: TrayManager
}

function hideWindowsTaskbarPreviewThumbnail(window: BrowserWindow) {
  if (isWindows()) {
    window.setThumbnailClip({ x: 0, y: 0, width: 1, height: 1 })
  }
}

export async function createWindowState({
  shell,
  appState,
  appLocale,
  teardown,
}: {
  shell: Shell
  appLocale: string
  appState: AppState
  teardown: () => void
}): Promise<WindowState> {
  const window = await createWindow(appState.store)

  const services = await createWindowServices(window, appState, appLocale)

  require('@electron/remote/main').enable(window.webContents)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(global as any).RemoteBridge = new RemoteBridge(
    window,
    Keychain,
    services.packageManager,
    services.searchManager,
    {
      destroySensitiveDirectories: () => {
        const restart = true
        clearSensitiveDirectories(restart)
      },
    },
    services.menuManager,
    services.fileBackupsManager,
    services.mediaManager,
    services.homeServerManager,
    services.directoryManager,
  )

  const shouldOpenUrl = (url: string) => url.startsWith('http') || url.startsWith('mailto')

  window.on('closed', teardown)

  window.on('show', () => {
    void checkForUpdate(appState, appState.updates, false)
    hideWindowsTaskbarPreviewThumbnail(window)
  })

  window.on('focus', () => {
    window.webContents.send(MessageToWebApp.WindowFocused, null)
  })

  window.on('blur', () => {
    window.webContents.send(MessageToWebApp.WindowBlurred, null)
  })

  window.once('ready-to-show', () => {
    window.show()
  })

  window.on('close', (event) => {
    if (!appState.willQuitApp && (isMac() || services.trayManager.shouldMinimizeToTray())) {
      /**
       * On MacOS, closing a window does not quit the app. On Window and Linux,
       * it only does if you haven't enabled minimize to tray.
       */
      event.preventDefault()
      /**
       * Handles Mac full screen issue where pressing close results
       * in a black screen.
       */
      if (window.isFullScreen()) {
        window.setFullScreen(false)
      }
      window.hide()
    }
  })

  window.webContents.session.setSpellCheckerDictionaryDownloadURL('https://dictionaries.standardnotes.org/9.4.4/')

  /** handle link clicks */
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (shouldOpenUrl(url)) {
      void shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  /**
   * handle link clicks (this event is fired instead of 'new-window' when
   * target is not set to _blank, such as with window.location.assign)
   */
  window.webContents.on('will-navigate', (event, url) => {
    /** Check for windowUrl equality in the case of window.reload() calls. */
    if (fileUrlsAreEqual(url, appState.startUrl)) {
      return
    }
    if (shouldOpenUrl(url)) {
      void shell.openExternal(url)
    }
    event.preventDefault()
  })

  window.webContents.on('context-menu', (_event, params) => {
    buildContextMenu(window.webContents, params).popup()
  })

  return {
    window,
    ...services,
  }
}

async function createWindow(store: Store): Promise<Electron.BrowserWindow> {
  const useSystemMenuBar = store.get(StoreKeys.UseSystemMenuBar)
  const position = await getPreviousWindowPosition()
  const window = new BrowserWindow({
    ...position.bounds,
    minWidth: WINDOW_MIN_WIDTH,
    minHeight: WINDOW_MIN_HEIGHT,
    show: false,
    icon: path.join(__dirname, '/icon/Icon-512x512.png'),
    titleBarStyle: isMac() || useSystemMenuBar ? 'hiddenInset' : undefined,
    frame: isMac() ? false : useSystemMenuBar,
    webPreferences: {
      spellcheck: true,
      nodeIntegration: isTesting(),
      contextIsolation: true,
      sandbox: true,
      preload: Paths.preloadJs,
    },
  })
  if (position.isFullScreen) {
    window.setFullScreen(true)
  }

  if (position.isMaximized) {
    window.maximize()
  }
  persistWindowPosition(window)

  if (isTesting()) {
    handleTestMessage(MessageType.SpellCheckerLanguages, () => window.webContents.session.getSpellCheckerLanguages())
    handleTestMessage(MessageType.SetLocalStorageValue, async (key, value) => {
      await window.webContents.executeJavaScript(`localStorage.setItem("${key}", "${value}")`)
      window.webContents.session.flushStorageData()
    })
    handleTestMessage(MessageType.SignOut, () => window.webContents.executeJavaScript('window.device.onSignOut(false)'))
    window.webContents.once('did-finish-load', () => {
      send(AppMessageType.WindowLoaded)
    })
  }

  return window
}

async function createWindowServices(window: Electron.BrowserWindow, appState: AppState, appLocale: string) {
  const packageManager = await initializePackageManager(window.webContents)
  const searchManager = initializeSearchManager(window.webContents)
  initializeZoomManager(window, appState.store)

  const updateManager = setupUpdates(window, appState)
  const trayManager = createTrayManager(window, appState.store)
  const spellcheckerManager = createSpellcheckerManager(appState.store, window.webContents, appLocale)
  const mediaManager = new MediaManager()

  const filesManager = new FilesManager()
  const directoryManager = new DirectoryManager(filesManager)

  const homeServerManager = new HomeServerManager(window.webContents, filesManager)

  if (isTesting()) {
    handleTestMessage(MessageType.SpellCheckerManager, () => spellcheckerManager)
  }

  const menuManager = createMenuManager({
    appState,
    window,
    trayManager,
    store: appState.store,
    spellcheckerManager,
  })

  const fileBackupsManager = new FilesBackupManager(appState, window.webContents, filesManager)

  return {
    updateManager,
    trayManager,
    spellcheckerManager,
    menuManager,
    packageManager,
    searchManager,
    fileBackupsManager,
    mediaManager,
    homeServerManager,
    directoryManager,
  }
}

/**
 * Check file urls for equality by decoding components
 * In packaged app, spaces in navigation events urls can contain %20
 * but not in windowUrl.
 */
function fileUrlsAreEqual(a: string, b: string): boolean {
  /** Catch exceptions in case of malformed urls. */
  try {
    /**
     * Craft URL objects to eliminate production URL values that can
     * contain "#!/" suffixes (on Windows)
     */
    let aPath = new URL(decodeURIComponent(a)).pathname
    let bPath = new URL(decodeURIComponent(b)).pathname
    if (isWindows()) {
      /** On Windows, drive letter casing is inconsistent */
      aPath = lowercaseDriveLetter(aPath)
      bPath = lowercaseDriveLetter(bPath)
    }
    return aPath === bPath
  } catch (error) {
    return false
  }
}

interface WindowPosition {
  bounds: Rectangle
  isMaximized: boolean
  isFullScreen: boolean
}

async function getPreviousWindowPosition() {
  let position: WindowPosition
  try {
    position = JSON.parse(await fs.promises.readFile(path.join(Paths.userDataDir, 'window-position.json'), 'utf8'))
  } catch (e) {
    return {
      bounds: {
        width: WINDOW_DEFAULT_WIDTH,
        height: WINDOW_DEFAULT_HEIGHT,
      },
    }
  }

  const options: Partial<Rectangle> = {}
  const bounds = position.bounds
  if (bounds) {
    /** Validate coordinates. Keep them if the window can fit on a screen */
    const area = screen.getDisplayMatching(bounds).workArea
    if (
      bounds.x >= area.x &&
      bounds.y >= area.y &&
      bounds.x + bounds.width <= area.x + area.width &&
      bounds.y + bounds.height <= area.y + area.height
    ) {
      options.x = bounds.x
      options.y = bounds.y
    }
    if (bounds.width <= area.width || bounds.height <= area.height) {
      options.width = bounds.width
      options.height = bounds.height
    }
  }

  return {
    isMaximized: position.isMaximized,
    isFullScreen: position.isFullScreen,
    bounds: {
      width: WINDOW_DEFAULT_WIDTH,
      height: WINDOW_DEFAULT_HEIGHT,
      ...options,
    },
  }
}

function persistWindowPosition(window: BrowserWindow) {
  let writingToDisk = false

  const saveWindowBounds = debounce(async () => {
    const position: WindowPosition = {
      bounds: window.getNormalBounds(),
      isMaximized: window.isMaximized(),
      isFullScreen: window.isFullScreen(),
    }

    if (writingToDisk) {
      return
    }

    writingToDisk = true
    try {
      await fs.promises.writeFile(Paths.windowPositionJson, JSON.stringify(position), 'utf-8')
    } catch (error) {
      console.error('Could not write to window-position.json', error)
    } finally {
      writingToDisk = false
    }
  }, 500)

  window.on('resize', saveWindowBounds)
  window.on('move', saveWindowBounds)
}

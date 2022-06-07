import { AppState } from 'app/application'
import {
  app,
  BrowserWindow,
  ContextMenuParams,
  dialog,
  Menu,
  MenuItemConstructorOptions,
  shell,
  WebContents,
} from 'electron'
import { autorun } from 'mobx'
import { autoUpdatingAvailable } from '../Types/Constants'
import { isLinux, isMac } from '../Types/Platforms'
import { Store, StoreKeys } from '../Store'
import { appMenu as str, contextMenu } from '../Strings'
import { handleTestMessage } from '../Utils/Testing'
import { TrayManager } from '../TrayManager'
import { SpellcheckerManager } from './../SpellcheckerManager'
import { BackupsManagerInterface } from './../Backups/BackupsManagerInterface'
import { MessageType } from './../../../../test/TestIpcMessage'
import { checkForUpdate, openChangelog, showUpdateInstallationDialog } from '../UpdateManager'
import { isDev, isTesting } from '../Utils/Utils'
import { MenuManagerInterface } from './MenuManagerInterface'

export const enum MenuId {
  SpellcheckerLanguages = 'SpellcheckerLanguages',
}

const Separator: MenuItemConstructorOptions = {
  type: 'separator',
}

export function buildContextMenu(webContents: WebContents, params: ContextMenuParams): Menu {
  if (!params.isEditable) {
    return Menu.buildFromTemplate([
      {
        role: 'copy',
      },
    ])
  }

  return Menu.buildFromTemplate([
    ...suggestionsMenu(params.selectionText, params.misspelledWord, params.dictionarySuggestions, webContents),
    Separator,
    {
      role: 'undo',
    },
    {
      role: 'redo',
    },
    Separator,
    {
      role: 'cut',
    },
    {
      role: 'copy',
    },
    {
      role: 'paste',
    },
    {
      role: 'pasteAndMatchStyle',
    },
    {
      role: 'selectAll',
    },
  ])
}

function suggestionsMenu(
  selection: string,
  misspelledWord: string,
  suggestions: string[],
  webContents: WebContents,
): MenuItemConstructorOptions[] {
  if (misspelledWord.length === 0) {
    return []
  }

  const learnSpelling = {
    label: contextMenu().learnSpelling,
    click() {
      webContents.session.addWordToSpellCheckerDictionary(misspelledWord)
    },
  }

  if (suggestions.length === 0) {
    return [
      {
        label: contextMenu().noSuggestions,
        enabled: false,
      },
      Separator,
      learnSpelling,
    ]
  }

  return [
    ...suggestions.map((suggestion) => ({
      label: suggestion,
      click() {
        webContents.replaceMisspelling(suggestion)
      },
    })),
    Separator,
    learnSpelling,
  ]
}

export function createMenuManager({
  window,
  appState,
  backupsManager,
  trayManager,
  store,
  spellcheckerManager,
}: {
  window: Electron.BrowserWindow
  appState: AppState
  backupsManager: BackupsManagerInterface
  trayManager: TrayManager
  store: Store
  spellcheckerManager?: SpellcheckerManager
}): MenuManagerInterface {
  let menu: Menu

  if (isTesting()) {
    // eslint-disable-next-line no-var
    var hasReloaded = false
    // eslint-disable-next-line no-var
    var hasReloadedTimeout: any
    handleTestMessage(MessageType.AppMenuItems, () =>
      menu.items.map((item) => ({
        label: item.label,
        role: item.role,
        submenu: {
          items: item.submenu?.items?.map((subItem) => ({
            id: subItem.id,
            label: subItem.label,
          })),
        },
      })),
    )
    handleTestMessage(MessageType.ClickLanguage, (code) => {
      menu.getMenuItemById(MessageType.ClickLanguage + code)!.click()
    })
    handleTestMessage(MessageType.HasReloadedMenu, () => hasReloaded)
  }

  function reload() {
    if (isTesting()) {
      hasReloaded = true
      clearTimeout(hasReloadedTimeout)
      hasReloadedTimeout = setTimeout(() => {
        hasReloaded = false
      }, 300)
    }
    menu = Menu.buildFromTemplate([
      ...(isMac() ? [macAppMenu(app.name)] : []),
      editMenu(spellcheckerManager, reload),
      viewMenu(window, store, reload),
      windowMenu(store, trayManager, reload),
      backupsMenu(backupsManager, reload),
      updateMenu(window, appState),
      ...(isLinux() ? [keyringMenu(window, store)] : []),
      helpMenu(window, shell),
    ])
    Menu.setApplicationMenu(menu)
  }
  autorun(() => {
    reload() // initialization
  })

  return {
    reload,
    popupMenu() {
      if (isDev()) {
        /** Check the state */
        if (!menu) throw new Error('called popupMenu() before loading')
      }
      // eslint-disable-next-line no-unused-expressions
      menu?.popup()
    },
  }
}

const enum Roles {
  Undo = 'undo',
  Redo = 'redo',
  Cut = 'cut',
  Copy = 'copy',
  Paste = 'paste',
  PasteAndMatchStyle = 'pasteAndMatchStyle',
  SelectAll = 'selectAll',
  Reload = 'reload',
  ToggleDevTools = 'toggleDevTools',
  ResetZoom = 'resetZoom',
  ZoomIn = 'zoomIn',
  ZoomOut = 'zoomOut',
  ToggleFullScreen = 'togglefullscreen',
  Window = 'window',
  Minimize = 'minimize',
  Close = 'close',
  Help = 'help',
  About = 'about',
  Services = 'services',
  Hide = 'hide',
  HideOthers = 'hideOthers',
  UnHide = 'unhide',
  Quit = 'quit',
  StartSeeking = 'startSpeaking',
  StopSeeking = 'stopSpeaking',
  Zoom = 'zoom',
  Front = 'front',
}

const KeyCombinations = {
  CmdOrCtrlW: 'CmdOrCtrl + W',
  CmdOrCtrlM: 'CmdOrCtrl + M',
  AltM: 'Alt + m',
}

const enum MenuItemTypes {
  CheckBox = 'checkbox',
  Radio = 'radio',
}

const Urls = {
  Support: 'mailto:help@standardnotes.com',
  Website: 'https://standardnotes.com',
  GitHub: 'https://github.com/standardnotes',
  Slack: 'https://standardnotes.com/slack',
  Twitter: 'https://twitter.com/StandardNotes',
  GitHubReleases: 'https://github.com/standardnotes/desktop/releases',
}

function macAppMenu(appName: string): MenuItemConstructorOptions {
  return {
    role: 'appMenu',
    label: appName,
    submenu: [
      {
        role: Roles.About,
      },
      Separator,
      {
        role: Roles.Services,
        submenu: [],
      },
      Separator,
      {
        role: Roles.Hide,
      },
      {
        role: Roles.HideOthers,
      },
      {
        role: Roles.UnHide,
      },
      Separator,
      {
        role: Roles.Quit,
      },
    ],
  }
}

function editMenu(spellcheckerManager: SpellcheckerManager | undefined, reload: () => any): MenuItemConstructorOptions {
  if (isDev()) {
    /** Check for invalid state */
    if (!isMac() && spellcheckerManager === undefined) {
      throw new Error('spellcheckerManager === undefined')
    }
  }

  return {
    role: 'editMenu',
    label: str().edit,
    submenu: [
      {
        role: Roles.Undo,
      },
      {
        role: Roles.Redo,
      },
      Separator,
      {
        role: Roles.Cut,
      },
      {
        role: Roles.Copy,
      },
      {
        role: Roles.Paste,
      },
      {
        role: Roles.PasteAndMatchStyle,
      },
      {
        role: Roles.SelectAll,
      },
      ...(isMac() ? [Separator, macSpeechMenu()] : [spellcheckerMenu(spellcheckerManager!, reload)]),
    ],
  }
}

function macSpeechMenu(): MenuItemConstructorOptions {
  return {
    label: str().speech,
    submenu: [
      {
        role: Roles.StopSeeking,
      },
      {
        role: Roles.StopSeeking,
      },
    ],
  }
}

function spellcheckerMenu(spellcheckerManager: SpellcheckerManager, reload: () => any): MenuItemConstructorOptions {
  return {
    id: MenuId.SpellcheckerLanguages,
    label: str().spellcheckerLanguages,
    submenu: spellcheckerManager.languages().map(
      ({ name, code, enabled }): MenuItemConstructorOptions => ({
        ...(isTesting() ? { id: MessageType.ClickLanguage + code } : {}),
        label: name,
        type: MenuItemTypes.CheckBox,
        checked: enabled,
        click: () => {
          if (enabled) {
            spellcheckerManager.removeLanguage(code)
          } else {
            spellcheckerManager.addLanguage(code)
          }
          reload()
        },
      }),
    ),
  }
}

function viewMenu(window: Electron.BrowserWindow, store: Store, reload: () => any): MenuItemConstructorOptions {
  return {
    label: str().view,
    submenu: [
      {
        role: Roles.Reload,
      },
      {
        role: Roles.ToggleDevTools,
      },
      Separator,
      {
        role: Roles.ResetZoom,
      },
      {
        role: Roles.ZoomIn,
      },
      {
        role: Roles.ZoomOut,
      },
      Separator,
      {
        role: Roles.ToggleFullScreen,
      },
      ...(isMac() ? [] : [Separator, ...menuBarOptions(window, store, reload)]),
    ],
  }
}

function menuBarOptions(window: Electron.BrowserWindow, store: Store, reload: () => any) {
  const useSystemMenuBar = store.get(StoreKeys.UseSystemMenuBar)
  let isMenuBarVisible = store.get(StoreKeys.MenuBarVisible)
  window.setMenuBarVisibility(isMenuBarVisible)
  return [
    {
      visible: !isMac() && useSystemMenuBar,
      label: str().hideMenuBar,
      accelerator: KeyCombinations.AltM,
      click: () => {
        isMenuBarVisible = !isMenuBarVisible
        window.setMenuBarVisibility(isMenuBarVisible)
        store.set(StoreKeys.MenuBarVisible, isMenuBarVisible)
      },
    },
    {
      label: str().useThemedMenuBar,
      type: MenuItemTypes.CheckBox,
      checked: !useSystemMenuBar,
      click: () => {
        store.set(StoreKeys.UseSystemMenuBar, !useSystemMenuBar)
        reload()
        dialog.showMessageBox({
          title: str().preferencesChanged.title,
          message: str().preferencesChanged.message,
        })
      },
    },
  ]
}

function windowMenu(store: Store, trayManager: TrayManager, reload: () => any): MenuItemConstructorOptions {
  return {
    role: Roles.Window,
    submenu: [
      {
        role: Roles.Minimize,
      },
      {
        role: Roles.Close,
      },
      Separator,
      ...(isMac() ? macWindowItems() : [minimizeToTrayItem(store, trayManager, reload)]),
    ],
  }
}

function macWindowItems(): MenuItemConstructorOptions[] {
  return [
    {
      label: str().close,
      accelerator: KeyCombinations.CmdOrCtrlW,
      role: Roles.Close,
    },
    {
      label: str().minimize,
      accelerator: KeyCombinations.CmdOrCtrlM,
      role: Roles.Minimize,
    },
    {
      label: str().zoom,
      role: Roles.Zoom,
    },
    Separator,
    {
      label: str().bringAllToFront,
      role: Roles.Front,
    },
  ]
}

function minimizeToTrayItem(store: Store, trayManager: TrayManager, reload: () => any) {
  const minimizeToTray = trayManager.shouldMinimizeToTray()
  return {
    label: str().minimizeToTrayOnClose,
    type: MenuItemTypes.CheckBox,
    checked: minimizeToTray,
    click() {
      store.set(StoreKeys.MinimizeToTray, !minimizeToTray)
      if (trayManager.shouldMinimizeToTray()) {
        trayManager.createTrayIcon()
      } else {
        trayManager.destroyTrayIcon()
      }
      reload()
    },
  }
}

function backupsMenu(archiveManager: BackupsManagerInterface, reload: () => any) {
  return {
    label: str().backups,
    submenu: [
      {
        label: archiveManager.backupsAreEnabled ? str().disableAutomaticBackups : str().enableAutomaticBackups,
        click() {
          archiveManager.toggleBackupsStatus()
          reload()
        },
      },
      Separator,
      {
        label: str().changeBackupsLocation,
        click() {
          archiveManager.changeBackupsLocation()
        },
      },
      {
        label: str().openBackupsLocation,
        click() {
          shell.openPath(archiveManager.backupsLocation)
        },
      },
    ],
  }
}

function updateMenu(window: BrowserWindow, appState: AppState) {
  const updateState = appState.updates
  let label
  if (updateState.checkingForUpdate) {
    label = str().checkingForUpdate
  } else if (updateState.updateNeeded) {
    label = str().updateAvailable
  } else {
    label = str().updates
  }
  const submenu: MenuItemConstructorOptions[] = []
  const structure = { label, submenu }

  if (autoUpdatingAvailable) {
    if (updateState.autoUpdateDownloaded && updateState.latestVersion) {
      submenu.push({
        label: str().installPendingUpdate(updateState.latestVersion),
        click() {
          showUpdateInstallationDialog(window, appState)
        },
      })
    }

    submenu.push({
      type: 'checkbox',
      checked: updateState.enableAutoUpdate,
      label: str().enableAutomaticUpdates,
      click() {
        updateState.toggleAutoUpdate()
      },
    })

    submenu.push(Separator)
  }

  const latestVersion = updateState.latestVersion

  submenu.push({
    label: str().yourVersion(appState.version),
  })

  submenu.push({
    label: latestVersion ? str().latestVersion(latestVersion) : str().releaseNotes,
    click() {
      openChangelog(updateState)
    },
  })

  if (latestVersion) {
    submenu.push({
      label: str().viewReleaseNotes(latestVersion),
      click() {
        openChangelog(updateState)
      },
    })
  }

  if (autoUpdatingAvailable) {
    submenu.push(Separator)

    if (!updateState.checkingForUpdate) {
      submenu.push({
        label: str().checkForUpdate,
        click() {
          checkForUpdate(appState, updateState, true)
        },
      })
    }

    if (updateState.lastCheck && !updateState.checkingForUpdate) {
      submenu.push({
        label: str().lastUpdateCheck(updateState.lastCheck),
      })
    }
  }

  return structure
}

function helpMenu(window: Electron.BrowserWindow, shell: Electron.Shell) {
  return {
    role: Roles.Help,
    submenu: [
      {
        label: str().emailSupport,
        click() {
          shell.openExternal(Urls.Support)
        },
      },
      {
        label: str().website,
        click() {
          shell.openExternal(Urls.Website)
        },
      },
      {
        label: str().gitHub,
        click() {
          shell.openExternal(Urls.GitHub)
        },
      },
      {
        label: str().slack,
        click() {
          shell.openExternal(Urls.Slack)
        },
      },
      {
        label: str().twitter,
        click() {
          shell.openExternal(Urls.Twitter)
        },
      },
      Separator,
      {
        label: str().toggleErrorConsole,
        click() {
          window.webContents.toggleDevTools()
        },
      },
      {
        label: str().openDataDirectory,
        click() {
          const userDataPath = app.getPath('userData')
          shell.openPath(userDataPath)
        },
      },
      {
        label: str().clearCacheAndReload,
        async click() {
          await window.webContents.session.clearCache()
          window.reload()
        },
      },
      Separator,
      {
        label: str().version(app.getVersion()),
        click() {
          shell.openExternal(Urls.GitHubReleases)
        },
      },
    ],
  }
}

/** It's called keyring on Ubuntu */
function keyringMenu(window: BrowserWindow, store: Store): MenuItemConstructorOptions {
  const useNativeKeychain = store.get(StoreKeys.UseNativeKeychain)
  return {
    label: str().security.security,
    submenu: [
      {
        enabled: !useNativeKeychain,
        checked: useNativeKeychain ?? false,
        type: 'checkbox',
        label: str().security.useKeyringtoStorePassword,
        async click() {
          store.set(StoreKeys.UseNativeKeychain, true)
          const { response } = await dialog.showMessageBox(window, {
            message: str().security.enabledKeyringAccessMessage,
            buttons: [str().security.enabledKeyringQuitNow, str().security.enabledKeyringPostpone],
          })
          if (response === 0) {
            app.quit()
          }
        },
      },
    ],
  }
}

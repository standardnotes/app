import { Menu, Tray } from 'electron'
import path from 'path'
import { Store } from './Store/Store'
import { StoreKeys } from './Store/StoreKeys'
import { AppName, tray as str } from './Strings'
import { isLinux, isWindows } from './Types/Platforms'
import { isDev } from './Utils/Utils'

const icon = path.join(__dirname, '/icon/Icon-256x256.png')

export interface TrayManager {
  shouldMinimizeToTray(): boolean
  createTrayIcon(): void
  destroyTrayIcon(): void
}

export function createTrayManager(window: Electron.BrowserWindow, store: Store): TrayManager {
  let tray: Tray | undefined
  let updateContextMenu: (() => void) | undefined

  function showWindow() {
    window.show()

    if (isLinux()) {
      /* On some versions of GNOME the window may not be on top when
      restored. */
      window.setAlwaysOnTop(true)
      window.focus()
      window.setAlwaysOnTop(false)
    }
  }

  return {
    shouldMinimizeToTray() {
      return store.get(StoreKeys.MinimizeToTray)
    },

    createTrayIcon() {
      tray = new Tray(icon)
      tray.setToolTip(AppName)

      if (isWindows()) {
        /* On Windows, right-clicking invokes the menu, as opposed to
        left-clicking for the other platforms. So we map left-clicking
        to the conventional action of showing the app. */
        tray.on('click', showWindow)
      }

      const SHOW_WINDOW_ID = 'SHOW_WINDOW'
      const HIDE_WINDOW_ID = 'HIDE_WINDOW'
      const trayContextMenu = Menu.buildFromTemplate([
        {
          id: SHOW_WINDOW_ID,
          label: str().show,
          click: showWindow,
        },
        {
          id: HIDE_WINDOW_ID,
          label: str().hide,
          click() {
            window.hide()
          },
        },
        {
          type: 'separator',
        },
        {
          role: 'quit',
          label: str().quit,
        },
      ])

      updateContextMenu = function updateContextMenu() {
        if (window.isVisible()) {
          trayContextMenu.getMenuItemById(SHOW_WINDOW_ID)!.visible = false
          trayContextMenu.getMenuItemById(HIDE_WINDOW_ID)!.visible = true
        } else {
          trayContextMenu.getMenuItemById(SHOW_WINDOW_ID)!.visible = true
          trayContextMenu.getMenuItemById(HIDE_WINDOW_ID)!.visible = false
        }

        tray!.setContextMenu(trayContextMenu)
      }
      updateContextMenu()

      window.on('hide', updateContextMenu)
      window.on('focus', updateContextMenu)
      window.on('blur', updateContextMenu)
    },

    destroyTrayIcon() {
      if (isDev()) {
        /** Check our state */
        if (!updateContextMenu) {
          throw new Error('updateContextMenu === undefined')
        }
        if (!tray) {
          throw new Error('tray === undefined')
        }
      }

      window.off('hide', updateContextMenu!)
      window.off('focus', updateContextMenu!)
      window.off('blur', updateContextMenu!)
      tray!.destroy()
      tray = undefined
      updateContextMenu = undefined
    },
  }
}

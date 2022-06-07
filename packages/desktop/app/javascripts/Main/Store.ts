import fs from 'fs'
import path from 'path'
import { MessageType } from '../../../test/TestIpcMessage'
import { Language } from './SpellcheckerManager'
import { ensureIsBoolean, isTesting, isDev, isBoolean } from './Utils/Utils'
import { FileDoesNotExist } from './Utils/FileUtils'
import { BackupsDirectoryName } from './Backups/BackupsManager'
import { handleTestMessage } from './Utils/Testing'

const app = process.type === 'browser' ? require('electron').app : require('@electron/remote').app

function logError(...message: any) {
  console.error('store:', ...message)
}

export enum StoreKeys {
  ExtServerHost = 'extServerHost',
  UseSystemMenuBar = 'useSystemMenuBar',
  MenuBarVisible = 'isMenuBarVisible',
  BackupsLocation = 'backupsLocation',
  BackupsDisabled = 'backupsDisabled',
  MinimizeToTray = 'minimizeToTray',
  EnableAutoUpdate = 'enableAutoUpdates',
  ZoomFactor = 'zoomFactor',
  SelectedSpellCheckerLanguageCodes = 'selectedSpellCheckerLanguageCodes',
  UseNativeKeychain = 'useNativeKeychain',

  FileBackupsEnabled = 'fileBackupsEnabled',
  FileBackupsLocation = 'fileBackupsLocation',
}

interface StoreData {
  [StoreKeys.ExtServerHost]: string
  [StoreKeys.UseSystemMenuBar]: boolean
  [StoreKeys.MenuBarVisible]: boolean
  [StoreKeys.BackupsLocation]: string
  [StoreKeys.BackupsDisabled]: boolean
  [StoreKeys.MinimizeToTray]: boolean
  [StoreKeys.EnableAutoUpdate]: boolean
  [StoreKeys.UseNativeKeychain]: boolean | null
  [StoreKeys.ZoomFactor]: number
  [StoreKeys.SelectedSpellCheckerLanguageCodes]: Set<Language> | null
  [StoreKeys.FileBackupsEnabled]: boolean
  [StoreKeys.FileBackupsLocation]: string
}

function createSanitizedStoreData(data: any = {}): StoreData {
  return {
    [StoreKeys.MenuBarVisible]: ensureIsBoolean(data[StoreKeys.MenuBarVisible], true),
    [StoreKeys.UseSystemMenuBar]: ensureIsBoolean(data[StoreKeys.UseSystemMenuBar], false),
    [StoreKeys.BackupsDisabled]: ensureIsBoolean(data[StoreKeys.BackupsDisabled], false),
    [StoreKeys.MinimizeToTray]: ensureIsBoolean(data[StoreKeys.MinimizeToTray], false),
    [StoreKeys.EnableAutoUpdate]: ensureIsBoolean(data[StoreKeys.EnableAutoUpdate], true),
    [StoreKeys.UseNativeKeychain]: isBoolean(data[StoreKeys.UseNativeKeychain])
      ? data[StoreKeys.UseNativeKeychain]
      : null,
    [StoreKeys.ExtServerHost]: data[StoreKeys.ExtServerHost],
    [StoreKeys.BackupsLocation]: sanitizeBackupsLocation(data[StoreKeys.BackupsLocation]),
    [StoreKeys.ZoomFactor]: sanitizeZoomFactor(data[StoreKeys.ZoomFactor]),
    [StoreKeys.SelectedSpellCheckerLanguageCodes]: sanitizeSpellCheckerLanguageCodes(
      data[StoreKeys.SelectedSpellCheckerLanguageCodes],
    ),
    [StoreKeys.FileBackupsEnabled]: ensureIsBoolean(data[StoreKeys.FileBackupsEnabled], false),
    [StoreKeys.FileBackupsLocation]: data[StoreKeys.FileBackupsLocation],
  }
}

function sanitizeZoomFactor(factor?: any): number {
  if (typeof factor === 'number' && factor > 0) {
    return factor
  } else {
    return 1
  }
}

function sanitizeBackupsLocation(location?: unknown): string {
  const defaultPath = path.join(
    isTesting() ? app.getPath('userData') : isDev() ? app.getPath('documents') : app.getPath('home'),
    BackupsDirectoryName,
  )

  if (typeof location !== 'string') {
    return defaultPath
  }

  try {
    const stat = fs.lstatSync(location)
    if (stat.isDirectory()) {
      return location
    }
    /** Path points to something other than a directory */
    return defaultPath
  } catch (e) {
    /** Path does not point to a valid directory */
    logError(e)
    return defaultPath
  }
}

function sanitizeSpellCheckerLanguageCodes(languages?: unknown): Set<Language> | null {
  if (!languages) return null
  if (!Array.isArray(languages)) return null

  const set = new Set<Language>()
  const validLanguages = Object.values(Language)
  for (const language of languages) {
    if (validLanguages.includes(language)) {
      set.add(language)
    }
  }
  return set
}

export function serializeStoreData(data: StoreData): string {
  return JSON.stringify(data, (_key, value) => {
    if (value instanceof Set) {
      return Array.from(value)
    }
    return value
  })
}

function parseDataFile(filePath: string) {
  try {
    const fileData = fs.readFileSync(filePath)
    const userData = JSON.parse(fileData.toString())
    return createSanitizedStoreData(userData)
  } catch (error: any) {
    console.log('Error reading store file', error)
    if (error.code !== FileDoesNotExist) {
      logError(error)
    }

    return createSanitizedStoreData({})
  }
}

export class Store {
  static instance: Store
  readonly path: string
  readonly data: StoreData

  static getInstance(): Store {
    if (!this.instance) {
      /**
       * Renderer process has to get `app` module via `remote`, whereas the main process
       * can get it directly app.getPath('userData') will return a string of the user's
       * app data directory path.
       * TODO(baptiste): stop using Store in the renderer process.
       */
      const userDataPath = app.getPath('userData')
      this.instance = new Store(userDataPath)
    }
    return this.instance
  }

  static get<T extends keyof StoreData>(key: T): StoreData[T] {
    return this.getInstance().get(key)
  }

  constructor(userDataPath: string) {
    this.path = path.join(userDataPath, 'user-preferences.json')
    this.data = parseDataFile(this.path)

    if (isTesting()) {
      handleTestMessage(MessageType.StoreSettingsLocation, () => this.path)
      handleTestMessage(MessageType.StoreSet, (key, value) => {
        this.set(key, value)
      })
    }
  }

  get<T extends keyof StoreData>(key: T): StoreData[T] {
    return this.data[key]
  }

  set<T extends keyof StoreData>(key: T, val: StoreData[T]): void {
    this.data[key] = val
    fs.writeFileSync(this.path, serializeStoreData(this.data))
  }
}

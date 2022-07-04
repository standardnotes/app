import fs from 'fs'
import path from 'path'
import { BackupsDirectoryName } from '../Backups/BackupsManager'
import { Language } from '../SpellcheckerManager'
import { FileDoesNotExist } from '../Utils/FileUtils'
import { ensureIsBoolean, isBoolean, isDev, isTesting } from '../Utils/Utils'
import { StoreData, StoreKeys } from './StoreKeys'
import { app, logError } from './Store'

export function createSanitizedStoreData(data: any = {}): StoreData {
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
    [StoreKeys.LastRunVersion]: data[StoreKeys.LastRunVersion],
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
  if (!languages) {
    return null
  }
  if (!Array.isArray(languages)) {
    return null
  }

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

export function parseDataFile(filePath: string) {
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

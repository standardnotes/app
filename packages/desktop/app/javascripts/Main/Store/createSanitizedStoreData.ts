import fs from 'fs'
import { Language } from '../SpellcheckerManager'
import { FileDoesNotExist } from '../Utils/FileUtils'
import { ensureIsBoolean, isBoolean } from '../Utils/Utils'
import { StoreData, StoreKeys } from './StoreKeys'
import { logError } from './Store'

export function createSanitizedStoreData(data: any = {}): StoreData {
  return {
    [StoreKeys.MenuBarVisible]: ensureIsBoolean(data[StoreKeys.MenuBarVisible], true),
    [StoreKeys.UseSystemMenuBar]: ensureIsBoolean(data[StoreKeys.UseSystemMenuBar], false),
    [StoreKeys.MinimizeToTray]: ensureIsBoolean(data[StoreKeys.MinimizeToTray], false),
    [StoreKeys.EnableAutoUpdate]: ensureIsBoolean(data[StoreKeys.EnableAutoUpdate], true),
    [StoreKeys.UseNativeKeychain]: isBoolean(data[StoreKeys.UseNativeKeychain])
      ? data[StoreKeys.UseNativeKeychain]
      : null,
    [StoreKeys.ExtServerHost]: data[StoreKeys.ExtServerHost],
    [StoreKeys.ZoomFactor]: sanitizeZoomFactor(data[StoreKeys.ZoomFactor]),
    [StoreKeys.SelectedSpellCheckerLanguageCodes]: sanitizeSpellCheckerLanguageCodes(
      data[StoreKeys.SelectedSpellCheckerLanguageCodes],
    ),
    [StoreKeys.LastRunVersion]: data[StoreKeys.LastRunVersion],

    [StoreKeys.LegacyTextBackupsLocation]: data[StoreKeys.LegacyTextBackupsLocation],
    [StoreKeys.LegacyTextBackupsDisabled]: data[StoreKeys.LegacyTextBackupsDisabled],
    [StoreKeys.LegacyFileBackupsEnabled]: data[StoreKeys.LegacyFileBackupsEnabled],
    [StoreKeys.LegacyFileBackupsLocation]: data[StoreKeys.LegacyFileBackupsLocation],
  }
}
function sanitizeZoomFactor(factor?: any): number {
  if (typeof factor === 'number' && factor > 0) {
    return factor
  } else {
    return 1
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

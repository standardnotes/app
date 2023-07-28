import fs from 'fs'
import { Language } from '../SpellcheckerManager'
import { ensureIsBoolean, isBoolean } from '../Utils/Utils'
import { StoreData, StoreKeys } from './StoreKeys'
import { logError } from './Store'
import { FileErrorCodes } from '../File/FileErrorCodes'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.log('Error reading store file', error)
    if (error.code !== FileErrorCodes.FileDoesNotExist) {
      logError(error)
    }

    return createSanitizedStoreData({})
  }
}

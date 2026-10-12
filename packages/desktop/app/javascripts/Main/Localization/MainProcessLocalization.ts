import { addLocale, LocaleData, setDefaultLang, useLocale } from 'ttag'
import fs from 'fs/promises'
import path from 'path'
import { NativeLocalizationState } from '@standardnotes/snjs'
import { reinitializeStrings } from '../Strings'

const DEFAULT_LOCALE = 'en_US'

const loadedLocales = new Set<string>()
let appliedLocale = DEFAULT_LOCALE
let onStringsReloaded: (() => void) | undefined

setDefaultLang(DEFAULT_LOCALE)

export function registerMainProcessLocalizationCallbacks(callbacks: { onStringsReloaded: () => void }): void {
  onStringsReloaded = callbacks.onStringsReloaded
}

const WEB_LOCALE_FILE_PATTERN = /^(config\/locales|[a-z]{2,3}_[A-Za-z0-9]{2,4})\.json$/

function getLocalesDirectory(): string {
  return path.join(__dirname, 'locales')
}

export async function readWebLocaleFile(relativePath: string): Promise<string> {
  if (!WEB_LOCALE_FILE_PATTERN.test(relativePath)) {
    throw new Error(`Invalid web locale file: ${relativePath}`)
  }

  return fs.readFile(path.join(__dirname, 'web', 'locales', relativePath), 'utf8')
}

async function activateLocale(locale: string): Promise<void> {
  if (locale !== DEFAULT_LOCALE && !loadedLocales.has(locale)) {
    const filePath = path.join(getLocalesDirectory(), `${locale}.json`)
    const contents = await fs.readFile(filePath, 'utf8')
    addLocale(locale, JSON.parse(contents) as LocaleData)
    loadedLocales.add(locale)
  }

  useLocale(locale)
}

export async function syncMainProcessLocalization(state: NativeLocalizationState): Promise<void> {
  const locale = state.localizationEnabled && state.locale ? state.locale : DEFAULT_LOCALE
  if (locale === appliedLocale) {
    return
  }

  try {
    await activateLocale(locale)
    appliedLocale = locale
  } catch (error) {
    console.error(`Failed to load desktop locale pack for ${locale}`, error)
    useLocale(DEFAULT_LOCALE)
    appliedLocale = DEFAULT_LOCALE
  }

  reinitializeStrings()
  onStringsReloaded?.()
}

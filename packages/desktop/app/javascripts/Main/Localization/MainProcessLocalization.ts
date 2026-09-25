import { addLocale, LocaleData, setDefaultLang, useLocale } from 'ttag'
import fs from 'fs/promises'
import path from 'path'
import { MainProcessLocalizationState } from '../../Shared/MainProcessLocalizationState'
import { reinitializeStrings } from '../Strings'

const DEFAULT_LOCALE = 'en_US'

const loadedLocales = new Set<string>()
let onStringsReloaded: (() => void) | undefined

setDefaultLang(DEFAULT_LOCALE)

export function registerMainProcessLocalizationCallbacks(callbacks: { onStringsReloaded: () => void }): void {
  onStringsReloaded = callbacks.onStringsReloaded
}

function getLocalesDirectory(): string {
  return path.join(__dirname, 'locales')
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

export async function syncMainProcessLocalization(state: MainProcessLocalizationState): Promise<void> {
  const locale = state.localizationEnabled && state.locale ? state.locale : DEFAULT_LOCALE

  try {
    await activateLocale(locale)
  } catch (error) {
    console.error(`Failed to load desktop locale pack for ${locale}`, error)
    useLocale(DEFAULT_LOCALE)
  }

  reinitializeStrings()
  onStringsReloaded?.()
}

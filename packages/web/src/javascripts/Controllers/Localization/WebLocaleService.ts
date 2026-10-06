import { LOCALES_BASE_PATH, LocaleService } from '@standardnotes/i18n'
import { localizationStore } from '@/Controllers/Localization/LocalizationStore'
import { configureDateLocale } from '@/Utils/DateLocale'
import { getPersistedLocale } from '@/Utils/LocalePersistence'
import { isDesktopApplication } from '@/Utils'

let localeService: LocaleService | undefined

/** Desktop serves web from `web/`; the mobile shell serves the same dist under `web-src/`. */
function webLocalesBasePath(): string {
  if (typeof window === 'undefined' || window.location.protocol !== 'file:') {
    return LOCALES_BASE_PATH
  }

  return isDesktopApplication() ? 'web/locales' : 'web-src/locales'
}

function shouldUseFileDocumentFetch(): boolean {
  return typeof window !== 'undefined' && window.location.protocol === 'file:' && !isDesktopApplication()
}

function fetchJsonFromDocument<T>(resourcePath: string): Promise<T> {
  const url = new URL(resourcePath, window.location.href).href

  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('GET', url, true)
    request.responseType = 'text'
    request.onload = () => {
      const ok = request.status === 0 || (request.status >= 200 && request.status < 300)
      if (!ok) {
        reject(new Error(`Failed to load ${url}: HTTP ${request.status}`))
        return
      }

      try {
        resolve(JSON.parse(request.responseText) as T)
      } catch (error) {
        reject(error)
      }
    }
    request.onerror = () => reject(new Error(`Failed to load ${url}`))
    request.send()
  })
}

export function getWebLocaleService(): LocaleService {
  if (!localeService) {
    localeService = new LocaleService({
      localesBasePath: webLocalesBasePath(),
      ...(shouldUseFileDocumentFetch() ? { fetchJson: fetchJsonFromDocument } : {}),
    })
  }

  return localeService
}

export async function activatePersistedLocale(): Promise<void> {
  const persistedLocale = getPersistedLocale()
  if (!persistedLocale) {
    return
  }

  try {
    const service = getWebLocaleService()
    await service.loadAndActivateLocale(persistedLocale)
    await configureDateLocale({ appLocale: persistedLocale, localizationEnabled: true })
    localizationStore.setCurrentLocale(persistedLocale)
  } catch (error) {
    console.error('Failed to activate persisted locale', error)
  }
}

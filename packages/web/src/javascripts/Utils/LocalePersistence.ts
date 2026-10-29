const LOCALE_LOCAL_STORAGE_KEY = 'sn-locale'
const PENDING_LOCALE_SWITCH_KEY = 'sn-pending-locale-switch'

/** Persists the locale on this device for the next page load. */
export function persistLocale(locale: string): void {
  try {
    localStorage.setItem(LOCALE_LOCAL_STORAGE_KEY, locale)
  } catch {
    // Ignore quota / privacy errors
  }
}

/** Clears the persisted locale so Labs off does not leave a saved language choice. */
export function clearPersistedLocale(): void {
  try {
    localStorage.removeItem(LOCALE_LOCAL_STORAGE_KEY)
  } catch {
    // Ignore privacy errors
  }
}

export function getPersistedLocale(): string | undefined {
  try {
    return localStorage.getItem(LOCALE_LOCAL_STORAGE_KEY) || undefined
  } catch {
    return undefined
  }
}

export function setPendingLocaleSwitch(locale: string): void {
  try {
    sessionStorage.setItem(PENDING_LOCALE_SWITCH_KEY, locale)
  } catch {
    return
  }
}

export function takePendingLocaleSwitch(): string | undefined {
  try {
    const locale = sessionStorage.getItem(PENDING_LOCALE_SWITCH_KEY)
    sessionStorage.removeItem(PENDING_LOCALE_SWITCH_KEY)
    return locale || undefined
  } catch {
    return undefined
  }
}

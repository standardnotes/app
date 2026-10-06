import { PrefDefaults, PrefKey } from '@standardnotes/snjs'

import { WebApplication } from '@/Application/WebApplication'

export const LOCALE_COOKIE_NAME = 'locale'
const LOCALE_LOCAL_STORAGE_KEY = 'sn-locale'

const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365

function isFileProtocol(): boolean {
  return typeof window !== 'undefined' && window.location.protocol === 'file:'
}

function readLocaleFromLocalStorage(): string | undefined {
  try {
    const value = localStorage.getItem(LOCALE_LOCAL_STORAGE_KEY)
    return value || undefined
  } catch {
    return undefined
  }
}

function writeLocaleToLocalStorage(locale: string): void {
  try {
    localStorage.setItem(LOCALE_LOCAL_STORAGE_KEY, locale)
  } catch {
    // Ignore quota / privacy errors
  }
}

export function getLocaleCookie(): string | undefined {
  if (typeof document === 'undefined') {
    return undefined
  }

  const prefix = `${LOCALE_COOKIE_NAME}=`
  const entry = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))

  if (!entry) {
    return undefined
  }

  const value = decodeURIComponent(entry.slice(prefix.length))
  return value || undefined
}

export function setLocaleCookie(locale: string): void {
  if (typeof document === 'undefined') {
    return
  }

  document.cookie = `${LOCALE_COOKIE_NAME}=${encodeURIComponent(
    locale,
  )}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE_SECONDS}; samesite=lax`
}

/** Persists locale for the next page load. Electron `file://` cannot rely on cookies. */
export function persistLocale(locale: string): void {
  if (isFileProtocol()) {
    writeLocaleToLocalStorage(locale)
  }

  setLocaleCookie(locale)
}

/** Clears bootstrapped locale storage so Labs off does not leave a saved language choice. */
export function clearPersistedLocale(): void {
  if (isFileProtocol()) {
    try {
      localStorage.removeItem(LOCALE_LOCAL_STORAGE_KEY)
    } catch {
      // Ignore quota / privacy errors
    }
  }

  if (typeof document === 'undefined') {
    return
  }

  document.cookie = `${LOCALE_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`
}

export function getPersistedLocale(): string | undefined {
  if (isFileProtocol()) {
    const storedLocale = readLocaleFromLocalStorage()
    if (storedLocale) {
      return storedLocale
    }
  }

  return getLocaleCookie()
}

export function getSavedLocaleForApplication(application: WebApplication): string | undefined {
  return getPersistedLocale() ?? application.getPreference(PrefKey.Locale, PrefDefaults[PrefKey.Locale])
}

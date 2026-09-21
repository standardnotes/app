import { PrefDefaults, PrefKey } from '@standardnotes/snjs'

import { WebApplication } from '@/Application/WebApplication'

export const LOCALE_COOKIE_NAME = 'locale'

const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365

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

export function getSavedLocaleForApplication(application: WebApplication): string | undefined {
  const cookieLocale = getLocaleCookie()
  if (cookieLocale) {
    return cookieLocale
  }

  return application.getPreference(PrefKey.Locale, PrefDefaults[PrefKey.Locale])
}

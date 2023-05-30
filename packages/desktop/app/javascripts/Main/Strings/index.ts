import { isDev } from '../Utils/Utils'
import { createEnglishStrings } from './english'
import { createFrenchStrings } from './french'
import { Strings } from './types'

let strings: Strings

/**
 * MUST be called (once) before using any other export in this file.
 * @param locale The user's locale
 * @see https://www.electronjs.org/docs/api/locales
 */
export function initializeStrings(locale: string): void {
  if (isDev()) {
    if (strings) {
      throw new Error('`strings` has already been initialized')
    }
  }

  if (strings) {
    return
  }

  strings = stringsForLocale(locale)
}

export function str(): Strings {
  if (isDev()) {
    if (!strings) {
      throw new Error('tried to access strings before they were initialized.')
    }
  }
  return strings
}

export function appMenu() {
  return str().appMenu
}

export function contextMenu() {
  return str().contextMenu
}

export function tray() {
  return str().tray
}

export function extensions() {
  return str().extensions
}

export function updates() {
  return str().updates
}

function stringsForLocale(locale: string): Strings {
  if (locale === 'en' || locale.startsWith('en-')) {
    return createEnglishStrings()
  } else if (locale === 'fr' || locale.startsWith('fr-')) {
    return createFrenchStrings()
  }

  return createEnglishStrings()
}

export const AppName = 'Standard Notes'

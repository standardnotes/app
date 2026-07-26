import { isDev } from '../Utils/Utils'
import { createStrings } from './strings'
import { Strings } from './types'

let strings: Strings

/**
 * MUST be called (once) before using any other export in this file.
 * @param locale The user's locale
 * @see https://www.electronjs.org/docs/api/locales
 */
export function initializeStrings(_locale: string): void {
  if (isDev()) {
    if (strings) {
      throw new Error('`strings` has already been initialized')
    }
  }

  if (strings) {
    return
  }

  strings = createStrings()
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

export const AppName = 'Standard Notes'

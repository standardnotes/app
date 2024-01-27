import { Platform } from '@standardnotes/models'
import { isMacPlatform } from './platformCheck'

export enum KeyboardModifier {
  Shift = 'Shift',
  Ctrl = 'Control',
  /** ⌘ key on Mac, ⊞ key on Windows */
  Meta = 'Meta',
  Alt = 'Alt',
}

export function getPrimaryModifier(platform: Platform): KeyboardModifier {
  return isMacPlatform(platform) ? KeyboardModifier.Meta : KeyboardModifier.Ctrl
}

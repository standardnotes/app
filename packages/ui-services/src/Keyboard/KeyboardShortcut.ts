import { Platform } from '@standardnotes/snjs'
import { KeyboardCommand } from './KeyboardCommands'
import { KeyboardKey } from './KeyboardKey'
import { KeyboardModifier } from './KeyboardModifier'

export type KeyboardShortcut = {
  command: KeyboardCommand
  modifiers?: KeyboardModifier[]
  key?: KeyboardKey | string
  /**
   * Alternative to using key, if the key can be affected by alt + shift. For example, if you want alt + shift + n,
   * use code 'KeyN' instead of key 'n', as the modifiers would turn n into '˜' on Mac.
   */
  code?: string
  preventDefault?: boolean
}

export type PlatformedKeyboardShortcut = KeyboardShortcut & {
  platform: Platform
}

export type KeyboardShortcutCategory = 'General' | 'Notes list' | 'Current note' | 'Super notes' | 'Formatting'

export type KeyboardShortcutHelpItem = Omit<PlatformedKeyboardShortcut, 'command'> & {
  command?: KeyboardCommand
  category: KeyboardShortcutCategory
  description: string
}

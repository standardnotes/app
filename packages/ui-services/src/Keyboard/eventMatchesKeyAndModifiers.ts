import { KeyboardShortcut } from './KeyboardShortcut'
import { modifiersForEvent } from './modifiersForEvent'

export function eventMatchesKeyAndModifiers(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  const eventModifiers = modifiersForEvent(event)
  const shortcutModifiers = shortcut.modifiers ?? []

  if (eventModifiers.length !== shortcutModifiers.length) {
    return false
  }

  for (const modifier of shortcutModifiers) {
    if (!eventModifiers.includes(modifier)) {
      return false
    }
  }

  if (!shortcut.key && !shortcut.code) {
    return true
  }

  if (shortcut.key) {
    return shortcut.key.toLowerCase() === event.key.toLowerCase()
  } else {
    return shortcut.code === event.code
  }
}

import { TOGGLE_COMMAND_PALETTE } from './KeyboardCommands'
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

  if (shortcut.command === TOGGLE_COMMAND_PALETTE) {
    if (event.key === ':') {
      return true
    }

    // Mac Cmd suppresses the shift layer on punctuation keys, so ':' may appear as the
    // key's unshifted character instead. Each pair is the physical key (code) and the
    // unshifted character (key) for the ':' key on QWERTY, AZERTY, and QWERTZ.
    return (
      (event.code === 'Semicolon' && event.key === ';') ||
      (event.code === 'Period' && event.key === ';') ||
      (event.code === 'Period' && event.key === '.')
    )
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

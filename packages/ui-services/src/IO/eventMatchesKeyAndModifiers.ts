import { KeyboardKey } from './KeyboardKey'
import { KeyboardModifier } from './KeyboardModifier'
import { modifiersForEvent } from './modifiersForEvent'

export function eventMatchesKeyAndModifiers(
  event: KeyboardEvent,
  key: KeyboardKey | string | undefined,
  modifiers: KeyboardModifier[] = [],
): boolean {
  const eventModifiers = modifiersForEvent(event)
  if (eventModifiers.length !== modifiers.length) {
    return false
  }
  for (const modifier of modifiers) {
    if (!eventModifiers.includes(modifier)) {
      return false
    }
  }
  // Modifers match, check key
  if (!key) {
    return true
  }
  // In the browser, shift + f results in key 'f', but in Electron, shift + f results in 'F'
  // In our case we don't differentiate between the two.
  return key.toLowerCase() === event.key.toLowerCase()
}

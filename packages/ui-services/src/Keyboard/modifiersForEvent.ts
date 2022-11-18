import { KeyboardModifier } from './KeyboardModifier'

export function modifiersForEvent(event: KeyboardEvent): KeyboardModifier[] {
  const allModifiers = Object.values(KeyboardModifier)
  const eventModifiers = allModifiers.filter((modifier) => {
    // For a modifier like ctrlKey, must check both event.ctrlKey and event.key.
    // That's because on keyup, event.ctrlKey would be false, but event.key == Control would be true.
    const matches =
      ((event.ctrlKey || event.key === KeyboardModifier.Ctrl) && modifier === KeyboardModifier.Ctrl) ||
      ((event.metaKey || event.key === KeyboardModifier.Meta) && modifier === KeyboardModifier.Meta) ||
      ((event.altKey || event.key === KeyboardModifier.Alt) && modifier === KeyboardModifier.Alt) ||
      ((event.shiftKey || event.key === KeyboardModifier.Shift) && modifier === KeyboardModifier.Shift)

    return matches
  })

  return eventModifiers
}

import { keyboardCharacterForModifier } from './keyboardCharacterForModifier'
import { PlatformedKeyboardShortcut } from './KeyboardShortcut'

function stringForCode(code = ''): string {
  return code.replace('Key', '').replace('Digit', '')
}

export function keyboardStringForShortcut(shortcut: PlatformedKeyboardShortcut) {
  const key = shortcut.key?.toUpperCase() || stringForCode(shortcut.code)

  if (!shortcut.modifiers || shortcut.modifiers.length === 0) {
    return key
  }

  const modifierCharacters = shortcut.modifiers.map((modifier) =>
    keyboardCharacterForModifier(modifier, shortcut.platform),
  )

  return `${modifierCharacters.join('')}${key}`
}

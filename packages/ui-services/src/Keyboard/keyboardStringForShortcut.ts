import { keyboardCharacterForModifier } from './keyboardCharacterForModifier'
import { PlatformedKeyboardShortcut } from './KeyboardShortcut'
import { isWindowsPlatform } from './platformCheck'

function stringForCode(code = ''): string {
  return code.replace('Key', '').replace('Digit', '')
}

export function keyboardStringForShortcut(shortcut: PlatformedKeyboardShortcut | undefined) {
  if (!shortcut) {
    return ''
  }

  const key = shortcut.key?.toUpperCase() || stringForCode(shortcut.code)

  if (!shortcut.modifiers || shortcut.modifiers.length === 0) {
    return key
  }

  const modifierCharacters = shortcut.modifiers.map((modifier) =>
    keyboardCharacterForModifier(modifier, shortcut.platform),
  )

  if (isWindowsPlatform(shortcut.platform)) {
    return `${modifierCharacters.join('+')}+${key}`
  } else {
    return `${modifierCharacters.join('')}${key}`
  }
}

import { Platform } from '@standardnotes/snjs'
import { KeyboardModifier } from './KeyboardModifier'

function isMacPlatform(platform: Platform) {
  return platform === Platform.MacDesktop || platform === Platform.MacWeb
}

export function keyboardCharacterForModifier(modifier: KeyboardModifier, platform: Platform) {
  const isMac = isMacPlatform(platform)

  if (modifier === KeyboardModifier.Meta) {
    return isMac ? '⌘' : '⊞'
  } else if (modifier === KeyboardModifier.Ctrl) {
    return isMac ? '⌃' : 'Ctrl'
  } else if (modifier === KeyboardModifier.Alt) {
    return isMac ? '⌥' : 'Alt'
  } else if (modifier === KeyboardModifier.Shift) {
    return isMac ? '⇧' : 'Shift'
  } else {
    return KeyboardModifier[modifier]
  }
}

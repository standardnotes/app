import { KeyboardShortcutOverridesPreference } from '@standardnotes/snjs'
import { KeyboardModifier } from './KeyboardModifier'
import { KeyboardShortcut } from './KeyboardShortcut'
import { modifiersForEvent } from './modifiersForEvent'

/**
 * The key combination of a shortcut, without the command it triggers.
 * Replaces the default binding wholesale when used as an override.
 */
export type KeyboardShortcutBinding = Pick<KeyboardShortcut, 'key' | 'code' | 'modifiers' | 'preventDefault'>

/**
 * Overrides keyed by command id. `null` unbinds the command; commands not present keep their default binding.
 * Typed loosely because overrides come from synced or plugin data; bindings are validated when applied.
 */
export type KeyboardShortcutOverrides = KeyboardShortcutOverridesPreference

const validModifiers = new Set<string>(Object.values(KeyboardModifier))
const modifierKeys = new Set<string>([...Object.values(KeyboardModifier), 'OS', 'AltGraph', 'CapsLock', 'Dead'])

/** Display order of modifiers, matching the built-in shortcuts (e.g. Ctrl+Shift+F rather than Shift+Ctrl+F). */
const modifierOrder = [KeyboardModifier.Ctrl, KeyboardModifier.Meta, KeyboardModifier.Alt, KeyboardModifier.Shift]

function sortedModifiers(modifiers: KeyboardModifier[]): KeyboardModifier[] {
  return Array.from(new Set(modifiers)).sort((a, b) => modifierOrder.indexOf(a) - modifierOrder.indexOf(b))
}

/**
 * Validates a binding that may come from untrusted or persisted data.
 * Returns a clean copy, or undefined if the binding is unusable.
 * A binding must specify a key or code, since an empty binding would match any key press.
 */
export function sanitizeKeyboardShortcutBinding(binding: unknown): KeyboardShortcutBinding | undefined {
  if (typeof binding !== 'object' || binding === null) {
    return undefined
  }

  const { key, code, modifiers, preventDefault } = binding as Record<string, unknown>

  const cleanKey = typeof key === 'string' && key.length > 0 ? key : undefined
  const cleanCode = typeof code === 'string' && code.length > 0 ? code : undefined
  if (!cleanKey && !cleanCode) {
    return undefined
  }

  const modifiersAreValid =
    modifiers === undefined || (Array.isArray(modifiers) && modifiers.every((modifier) => validModifiers.has(modifier)))
  if (!modifiersAreValid || (preventDefault !== undefined && typeof preventDefault !== 'boolean')) {
    return undefined
  }

  return {
    key: cleanKey,
    code: cleanKey ? undefined : cleanCode,
    modifiers: modifiers ? sortedModifiers(modifiers as KeyboardModifier[]) : [],
    preventDefault,
  }
}

/**
 * Converts a keydown event into a shortcut binding, for recording a new shortcut.
 * Returns undefined while only modifier keys are held down.
 */
export function keyboardShortcutBindingForEvent(event: KeyboardEvent): KeyboardShortcutBinding | undefined {
  if (!event.key || modifierKeys.has(event.key)) {
    return undefined
  }

  const modifiers = sortedModifiers(modifiersForEvent(event))

  // Alt changes the produced character on Mac (alt + n gives '˜'), so bind to the physical key instead.
  if (modifiers.includes(KeyboardModifier.Alt) && /^(Key|Digit)/.test(event.code)) {
    return { code: event.code, modifiers }
  }

  return {
    key: event.key.length === 1 ? event.key.toLowerCase() : event.key,
    modifiers,
  }
}

/**
 * Whether a recorded binding is acceptable as a user shortcut. Plain keys would hijack typing,
 * so a non-Shift modifier is required, except for function keys.
 */
export function isValidUserKeyboardShortcutBinding(binding: KeyboardShortcutBinding): boolean {
  const hasModifier = (binding.modifiers ?? []).some((modifier) => modifier !== KeyboardModifier.Shift)
  return hasModifier || /^F\d{1,2}$/.test(binding.key ?? '')
}

export function keyboardShortcutBindingsEqual(a: KeyboardShortcutBinding, b: KeyboardShortcutBinding): boolean {
  const aModifiers = new Set(a.modifiers ?? [])
  const bModifiers = new Set(b.modifiers ?? [])
  if (aModifiers.size !== bModifiers.size || [...aModifiers].some((modifier) => !bModifiers.has(modifier))) {
    return false
  }

  if (a.key || b.key) {
    return !!a.key && !!b.key && a.key.toLowerCase() === b.key.toLowerCase()
  }

  return !!a.code && a.code === b.code
}

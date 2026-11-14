/**
 * @jest-environment jsdom
 */

import {
  isValidUserKeyboardShortcutBinding,
  keyboardShortcutBindingForEvent,
  keyboardShortcutBindingsEqual,
  sanitizeKeyboardShortcutBinding,
} from './KeyboardShortcutBinding'
import { KeyboardModifier } from './KeyboardModifier'

const event = (init: KeyboardEventInit) => new KeyboardEvent('keydown', init)

describe('keyboardShortcutBindingForEvent', () => {
  it('ignores modifier-only key presses', () => {
    expect(keyboardShortcutBindingForEvent(event({ key: 'Control', ctrlKey: true }))).toBeUndefined()
    expect(keyboardShortcutBindingForEvent(event({ key: 'Shift', shiftKey: true }))).toBeUndefined()
  })

  it('records a lowercased key with modifiers', () => {
    expect(keyboardShortcutBindingForEvent(event({ key: 'K', code: 'KeyK', ctrlKey: true, shiftKey: true }))).toEqual({
      key: 'k',
      modifiers: [KeyboardModifier.Ctrl, KeyboardModifier.Shift],
    })
  })

  it('records named keys as-is', () => {
    expect(keyboardShortcutBindingForEvent(event({ key: 'F5' }))).toEqual({ key: 'F5', modifiers: [] })
  })

  it('records the physical key code when alt is held', () => {
    expect(keyboardShortcutBindingForEvent(event({ key: '˜', code: 'KeyN', altKey: true }))).toEqual({
      code: 'KeyN',
      modifiers: [KeyboardModifier.Alt],
    })
  })
})

describe('keyboardShortcutBindingsEqual', () => {
  it('compares keys case-insensitively and modifiers as sets', () => {
    expect(
      keyboardShortcutBindingsEqual(
        { key: 'K', modifiers: [KeyboardModifier.Ctrl, KeyboardModifier.Shift] },
        { key: 'k', modifiers: [KeyboardModifier.Shift, KeyboardModifier.Ctrl] },
      ),
    ).toBe(true)
    expect(keyboardShortcutBindingsEqual({ key: 'k' }, { key: 'k', modifiers: [KeyboardModifier.Ctrl] })).toBe(false)
    expect(keyboardShortcutBindingsEqual({ code: 'KeyN' }, { code: 'KeyN' })).toBe(true)
    expect(keyboardShortcutBindingsEqual({ code: 'KeyN' }, { key: 'n' })).toBe(false)
  })
})

describe('sanitizeKeyboardShortcutBinding', () => {
  it('rejects malformed bindings', () => {
    expect(sanitizeKeyboardShortcutBinding(null)).toBeUndefined()
    expect(sanitizeKeyboardShortcutBinding('ctrl+k')).toBeUndefined()
    expect(sanitizeKeyboardShortcutBinding({ modifiers: [KeyboardModifier.Ctrl] })).toBeUndefined()
    expect(sanitizeKeyboardShortcutBinding({ key: 'k', modifiers: 'Control' })).toBeUndefined()
    expect(sanitizeKeyboardShortcutBinding({ key: 'k', preventDefault: 'yes' })).toBeUndefined()
  })

  it('sorts modifiers into display order', () => {
    expect(sanitizeKeyboardShortcutBinding({ key: 'g', modifiers: ['Shift', 'Alt', 'Control'] })?.modifiers).toEqual([
      KeyboardModifier.Ctrl,
      KeyboardModifier.Alt,
      KeyboardModifier.Shift,
    ])
  })

  it('prefers key over code and dedupes modifiers', () => {
    expect(
      sanitizeKeyboardShortcutBinding({ key: 'k', code: 'KeyK', modifiers: ['Control', 'Control'], extra: 1 }),
    ).toEqual({ key: 'k', code: undefined, modifiers: [KeyboardModifier.Ctrl], preventDefault: undefined })
  })
})

describe('isValidUserKeyboardShortcutBinding', () => {
  it('requires a non-shift modifier unless the key is a function key', () => {
    expect(isValidUserKeyboardShortcutBinding({ key: 'k', modifiers: [KeyboardModifier.Ctrl] })).toBe(true)
    expect(isValidUserKeyboardShortcutBinding({ code: 'KeyN', modifiers: [KeyboardModifier.Alt] })).toBe(true)
    expect(isValidUserKeyboardShortcutBinding({ key: 'F5', modifiers: [] })).toBe(true)
    expect(isValidUserKeyboardShortcutBinding({ key: 'k', modifiers: [] })).toBe(false)
    expect(isValidUserKeyboardShortcutBinding({ key: 'k', modifiers: [KeyboardModifier.Shift] })).toBe(false)
  })
})

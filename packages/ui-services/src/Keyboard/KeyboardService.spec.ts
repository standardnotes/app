/**
 * @jest-environment jsdom
 */

import { Environment, KeyboardShortcutOverridesPreference, Platform, UuidGenerator } from '@standardnotes/snjs'
import { PreferenceServiceInterface, PreferencesServiceEvent } from '@standardnotes/services'
import { KeyboardService } from './KeyboardService'
import {
  CREATE_NEW_NOTE_KEYBOARD_COMMAND,
  TOGGLE_COMMAND_PALETTE,
  TOGGLE_FOCUS_MODE_COMMAND,
  keyboardCommandForId,
  keyboardCommandId,
} from './KeyboardCommands'
import { KeyboardModifier } from './KeyboardModifier'

UuidGenerator.SetGenerator(() => String(Math.random()))

const CREATE_NOTE_ID = 'CREATE_NEW_NOTE_KEYBOARD_COMMAND'
const FOCUS_MODE_ID = 'TOGGLE_FOCUS_MODE_COMMAND'

describe('keyboard command ids', () => {
  it('round-trips between commands and ids', () => {
    expect(keyboardCommandId(CREATE_NEW_NOTE_KEYBOARD_COMMAND)).toBe(CREATE_NOTE_ID)
    expect(keyboardCommandForId(CREATE_NOTE_ID)).toBe(CREATE_NEW_NOTE_KEYBOARD_COMMAND)
    expect(keyboardCommandForId('NOT_A_COMMAND')).toBeUndefined()
  })
})

/** Minimal preferences service holding only the keyboard shortcut overrides. */
class FakePreferences {
  overrides: KeyboardShortcutOverridesPreference = {}
  private observers: ((event: PreferencesServiceEvent) => Promise<void>)[] = []

  getValue = () => this.overrides

  get observerCount() {
    return this.observers.length
  }

  addEventObserver = (observer: (event: PreferencesServiceEvent) => Promise<void>) => {
    this.observers.push(observer)
    return () => {
      this.observers = this.observers.filter((other) => other !== observer)
    }
  }

  change(overrides: KeyboardShortcutOverridesPreference) {
    this.overrides = overrides
    this.observers.forEach((observer) => observer(PreferencesServiceEvent.PreferencesChanged))
  }
}

describe('KeyboardService shortcut overrides', () => {
  let service: KeyboardService
  let preferences: FakePreferences

  const press = (init: KeyboardEventInit) => {
    window.dispatchEvent(new KeyboardEvent('keydown', init))
  }

  const handle = (command: symbol) => {
    const onKeyDown = jest.fn()
    service.addCommandHandler({ command, onKeyDown })
    return onKeyDown
  }

  beforeEach(() => {
    preferences = new FakePreferences()
    service = createService()
  })

  const createService = () =>
    new KeyboardService(
      Platform.WindowsDesktop,
      Environment.Desktop,
      preferences as unknown as PreferenceServiceInterface,
    )

  afterEach(() => {
    service.deinit()
  })

  it('uses the default binding when there are no overrides', () => {
    const onKeyDown = handle(CREATE_NEW_NOTE_KEYBOARD_COMMAND)
    press({ code: 'KeyN', key: 'n', altKey: true, shiftKey: true })
    expect(onKeyDown).toHaveBeenCalledTimes(1)
  })

  it('replaces the default binding with an override', () => {
    const onKeyDown = handle(CREATE_NEW_NOTE_KEYBOARD_COMMAND)
    service.setShortcutOverrides('test', { [CREATE_NOTE_ID]: { key: 'n', modifiers: [KeyboardModifier.Ctrl] } })

    press({ code: 'KeyN', key: 'n', altKey: true, shiftKey: true })
    expect(onKeyDown).not.toHaveBeenCalled()

    press({ code: 'KeyN', key: 'n', ctrlKey: true })
    expect(onKeyDown).toHaveBeenCalledTimes(1)

    expect(service.keyboardShortcutForCommand(CREATE_NEW_NOTE_KEYBOARD_COMMAND)).toMatchObject({
      key: 'n',
      modifiers: [KeyboardModifier.Ctrl],
    })
  })

  it('unbinds a command when its override is null', () => {
    const onKeyDown = handle(TOGGLE_FOCUS_MODE_COMMAND)
    service.setShortcutOverrides('test', { [FOCUS_MODE_ID]: null })

    press({ key: 'f', ctrlKey: true, shiftKey: true })
    expect(onKeyDown).not.toHaveBeenCalled()
    expect(service.keyboardShortcutForCommand(TOGGLE_FOCUS_MODE_COMMAND)).toBeUndefined()

    service.triggerCommand(TOGGLE_FOCUS_MODE_COMMAND)
    expect(onKeyDown).toHaveBeenCalledTimes(1)
  })

  it('restores defaults when a layer is removed', () => {
    service.setShortcutOverrides('test', { [FOCUS_MODE_ID]: null })
    service.removeShortcutOverrides('test')
    expect(service.keyboardShortcutForCommand(TOGGLE_FOCUS_MODE_COMMAND)).toMatchObject({ key: 'f' })
  })

  it('applies higher priority layers last', () => {
    service.setShortcutOverrides('test', { [FOCUS_MODE_ID]: { key: 'u' } }, 10)
    service.setShortcutOverrides('plugin', { [FOCUS_MODE_ID]: { key: 'p' } })
    expect(service.keyboardShortcutForCommand(TOGGLE_FOCUS_MODE_COMMAND)?.key).toBe('u')
  })

  it('applies equal priority layers in the order they were first set', () => {
    service.setShortcutOverrides('a', { [FOCUS_MODE_ID]: { key: 'a' } })
    service.setShortcutOverrides('b', { [FOCUS_MODE_ID]: { key: 'b' } })
    service.setShortcutOverrides('a', { [FOCUS_MODE_ID]: { key: 'c' } })
    expect(service.keyboardShortcutForCommand(TOGGLE_FOCUS_MODE_COMMAND)?.key).toBe('b')
  })

  it('ignores unknown commands and invalid bindings', () => {
    service.setShortcutOverrides('test', {
      NOT_A_COMMAND: { key: 'x' },
      [FOCUS_MODE_ID]: { modifiers: [KeyboardModifier.Ctrl] },
      [CREATE_NOTE_ID]: { key: 'x', modifiers: ['Hyper' as KeyboardModifier] },
    })
    expect(service.keyboardShortcutForCommand(TOGGLE_FOCUS_MODE_COMMAND)).toMatchObject({ key: 'f' })
    expect(service.keyboardShortcutForCommand(CREATE_NEW_NOTE_KEYBOARD_COMMAND)).toMatchObject({ code: 'KeyN' })
  })

  it('returns the default binding regardless of overrides', () => {
    service.setShortcutOverrides('test', { [FOCUS_MODE_ID]: null })
    expect(service.defaultKeyboardShortcutForCommand(TOGGLE_FOCUS_MODE_COMMAND)).toMatchObject({ key: 'f' })
  })

  it('keeps the default preventDefault unless the override sets it', () => {
    service.setShortcutOverrides('test', { [FOCUS_MODE_ID]: { key: 'g' } })
    expect(service.keyboardShortcutForCommand(TOGGLE_FOCUS_MODE_COMMAND)?.preventDefault).toBeUndefined()

    service.setShortcutOverrides('test', { OPEN_PREFERENCES_COMMAND: { key: '.' } })
    const prefs = keyboardCommandForId('OPEN_PREFERENCES_COMMAND') as symbol
    expect(service.keyboardShortcutForCommand(prefs)?.preventDefault).toBe(true)
  })

  it('notifies observers when shortcuts change', () => {
    const observer = jest.fn()
    const remove = service.addShortcutChangeObserver(observer)

    service.setShortcutOverrides('test', { [FOCUS_MODE_ID]: { key: 'g' } })
    service.removeShortcutOverrides('test')
    service.removeShortcutOverrides('test')
    expect(observer).toHaveBeenCalledTimes(2)

    remove()
    service.setShortcutOverrides('test', {})
    expect(observer).toHaveBeenCalledTimes(2)
  })

  it('reflects overrides in help items and hides unbound commands', () => {
    service.addCommandHandler({
      command: TOGGLE_FOCUS_MODE_COMMAND,
      category: 'General',
      description: 'Toggle focus mode',
      onKeyDown: jest.fn(),
    })

    service.setShortcutOverrides('test', { [FOCUS_MODE_ID]: { key: 'g' } })
    expect(service.getRegisteredKeyboardShorcutHelpItems()).toEqual([
      expect.objectContaining({ description: 'Toggle focus mode', key: 'g' }),
    ])

    service.setShortcutOverrides('test', { [FOCUS_MODE_ID]: null })
    expect(service.getRegisteredKeyboardShorcutHelpItems()).toEqual([])
  })

  it('applies the user overrides from preferences on creation and when they change', () => {
    service.deinit()
    preferences.overrides = { [FOCUS_MODE_ID]: { key: 'g', modifiers: [KeyboardModifier.Ctrl] } }
    service = createService()
    expect(service.keyboardShortcutForCommand(TOGGLE_FOCUS_MODE_COMMAND)?.key).toBe('g')

    const observer = jest.fn()
    service.addShortcutChangeObserver(observer)
    preferences.change({ [FOCUS_MODE_ID]: null })
    expect(service.keyboardShortcutForCommand(TOGGLE_FOCUS_MODE_COMMAND)).toBeUndefined()
    expect(observer).toHaveBeenCalledTimes(1)

    preferences.change({})
    expect(service.keyboardShortcutForCommand(TOGGLE_FOCUS_MODE_COMMAND)).toMatchObject({ key: 'f' })
  })

  it('gives user overrides precedence over other layers, and reserves their layer', () => {
    preferences.change({ [FOCUS_MODE_ID]: { key: 'u', modifiers: [KeyboardModifier.Ctrl] } })
    service.setShortcutOverrides('plugin', { [FOCUS_MODE_ID]: { key: 'p' } }, 10)
    expect(service.keyboardShortcutForCommand(TOGGLE_FOCUS_MODE_COMMAND)?.key).toBe('u')

    expect(() => service.setShortcutOverrides('user', {})).toThrow()
    service.removeShortcutOverrides('user')
    expect(service.keyboardShortcutForCommand(TOGGLE_FOCUS_MODE_COMMAND)?.key).toBe('u')
  })

  it('stops observing preferences when deinited', () => {
    expect(preferences.observerCount).toBe(1)
    service.deinit()
    expect(preferences.observerCount).toBe(0)
    service = createService()
  })

  it('only applies the command palette layout workaround to its default binding', () => {
    const onKeyDown = handle(TOGGLE_COMMAND_PALETTE)
    press({ code: 'Period', key: '.', ctrlKey: true, shiftKey: true })
    expect(onKeyDown).toHaveBeenCalledTimes(1)

    service.setShortcutOverrides('test', { TOGGLE_COMMAND_PALETTE: { key: 'p', modifiers: [KeyboardModifier.Ctrl] } })
    press({ code: 'Period', key: '.', ctrlKey: true, shiftKey: true })
    expect(onKeyDown).toHaveBeenCalledTimes(1)

    press({ code: 'KeyP', key: 'p', ctrlKey: true })
    expect(onKeyDown).toHaveBeenCalledTimes(2)
  })
})

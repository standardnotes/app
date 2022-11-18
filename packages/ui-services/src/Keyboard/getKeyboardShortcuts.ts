import { Environment, Platform } from '@standardnotes/snjs'
import {
  CREATE_NEW_NOTE_KEYBOARD_COMMAND,
  TOGGLE_LIST_PANE_KEYBOARD_COMMAND,
  TOGGLE_NAVIGATION_PANE_KEYBOARD_COMMAND,
  NEXT_LIST_ITEM_KEYBOARD_COMMAND,
  PREVIOUS_LIST_ITEM_KEYBOARD_COMMAND,
  SEARCH_KEYBOARD_COMMAND,
  SELECT_ALL_ITEMS_KEYBOARD_COMMAND,
  SHOW_HIDDEN_OPTIONS_KEYBOARD_COMMAND,
  DELETE_NOTE_KEYBOARD_COMMAND,
  TAB_COMMAND,
  ESCAPE_COMMAND,
  CANCEL_SEARCH_COMMAND,
  TOGGLE_FOCUS_MODE_COMMAND,
} from './KeyboardCommands'
import { KeyboardKey } from './KeyboardKey'
import { KeyboardModifier } from './KeyboardModifier'

export function getKeyboardShortcuts(_platform: Platform, _environment: Environment) {
  return [
    {
      command: TOGGLE_LIST_PANE_KEYBOARD_COMMAND,
      key: 'l',
      modifiers: [KeyboardModifier.Meta, KeyboardModifier.Shift],
    },
    {
      command: TOGGLE_NAVIGATION_PANE_KEYBOARD_COMMAND,
      key: 'e',
      modifiers: [KeyboardModifier.Meta, KeyboardModifier.Shift],
    },
    {
      command: CREATE_NEW_NOTE_KEYBOARD_COMMAND,
      code: 'KeyN',
      modifiers: [KeyboardModifier.Alt, KeyboardModifier.Shift],
    },
    {
      command: NEXT_LIST_ITEM_KEYBOARD_COMMAND,
      key: KeyboardKey.Down,
    },
    {
      command: PREVIOUS_LIST_ITEM_KEYBOARD_COMMAND,
      key: KeyboardKey.Up,
    },
    {
      command: SEARCH_KEYBOARD_COMMAND,
      key: 'f',
      modifiers: [KeyboardModifier.Alt, KeyboardModifier.Shift],
    },
    {
      command: CANCEL_SEARCH_COMMAND,
      key: KeyboardKey.Escape,
    },
    {
      command: SELECT_ALL_ITEMS_KEYBOARD_COMMAND,
      key: 'a',
      modifiers: [KeyboardModifier.Ctrl],
    },
    {
      command: SHOW_HIDDEN_OPTIONS_KEYBOARD_COMMAND,
      modifiers: [KeyboardModifier.Alt],
    },
    {
      command: DELETE_NOTE_KEYBOARD_COMMAND,
      key: KeyboardKey.Backspace,
      modifiers: [KeyboardModifier.Meta],
    },
    {
      command: TAB_COMMAND,
      key: KeyboardKey.Tab,
    },
    {
      command: ESCAPE_COMMAND,
      key: KeyboardKey.Escape,
    },
    {
      command: TOGGLE_FOCUS_MODE_COMMAND,
      key: 'f',
      modifiers: [KeyboardModifier.Meta, KeyboardModifier.Shift],
    },
  ]
}

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
  CHANGE_EDITOR_COMMAND,
  FOCUS_TAGS_INPUT_COMMAND,
  CREATE_NEW_TAG_COMMAND,
  OPEN_NOTE_HISTORY_COMMAND,
  CAPTURE_SAVE_COMMAND,
  STAR_NOTE_COMMAND,
  PIN_NOTE_COMMAND,
} from './KeyboardCommands'
import { KeyboardKey } from './KeyboardKey'
import { KeyboardModifier } from './KeyboardModifier'
import { KeyboardShortcut } from './KeyboardShortcut'

function isMacPlatform(platform: Platform) {
  return platform === Platform.MacDesktop || platform === Platform.MacWeb
}

export function getKeyboardShortcuts(platform: Platform, _environment: Environment): KeyboardShortcut[] {
  const isMac = isMacPlatform(platform)

  const primaryModifier = isMac ? KeyboardModifier.Meta : KeyboardModifier.Ctrl

  return [
    {
      command: TOGGLE_LIST_PANE_KEYBOARD_COMMAND,
      key: 'l',
      modifiers: [primaryModifier, KeyboardModifier.Shift],
    },
    {
      command: TOGGLE_NAVIGATION_PANE_KEYBOARD_COMMAND,
      key: 'e',
      modifiers: [primaryModifier, KeyboardModifier.Shift],
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
      code: 'KeyF',
      modifiers: [KeyboardModifier.Alt, KeyboardModifier.Shift],
    },
    {
      command: CANCEL_SEARCH_COMMAND,
      key: KeyboardKey.Escape,
    },
    {
      command: SELECT_ALL_ITEMS_KEYBOARD_COMMAND,
      key: 'a',
      modifiers: [primaryModifier],
    },
    {
      command: SHOW_HIDDEN_OPTIONS_KEYBOARD_COMMAND,
      modifiers: [KeyboardModifier.Alt],
    },
    {
      command: DELETE_NOTE_KEYBOARD_COMMAND,
      key: KeyboardKey.Backspace,
      modifiers: [primaryModifier],
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
      modifiers: [primaryModifier, KeyboardModifier.Shift],
    },
    {
      command: CHANGE_EDITOR_COMMAND,
      key: '/',
      modifiers: [primaryModifier, KeyboardModifier.Shift],
      preventDefault: true,
    },
    {
      command: FOCUS_TAGS_INPUT_COMMAND,
      code: 'KeyT',
      modifiers: [primaryModifier, KeyboardModifier.Alt],
      preventDefault: true,
    },
    {
      command: CREATE_NEW_TAG_COMMAND,
      code: 'KeyN',
      modifiers: [primaryModifier, KeyboardModifier.Alt],
    },
    {
      command: OPEN_NOTE_HISTORY_COMMAND,
      key: 'h',
      modifiers: [primaryModifier, KeyboardModifier.Shift],
      preventDefault: true,
    },
    {
      command: CAPTURE_SAVE_COMMAND,
      key: 's',
      modifiers: [primaryModifier],
      preventDefault: true,
    },
    {
      command: STAR_NOTE_COMMAND,
      key: 's',
      modifiers: [primaryModifier, KeyboardModifier.Shift],
      preventDefault: true,
    },
    {
      command: PIN_NOTE_COMMAND,
      key: 'p',
      modifiers: [primaryModifier, KeyboardModifier.Shift],
      preventDefault: true,
    },
  ]
}

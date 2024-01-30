import { Environment, Platform } from '@standardnotes/models'
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
  SUPER_SHOW_MARKDOWN_PREVIEW,
  OPEN_PREFERENCES_COMMAND,
  TOGGLE_DARK_MODE_COMMAND,
  SUPER_TOGGLE_SEARCH,
  SUPER_SEARCH_TOGGLE_CASE_SENSITIVE,
  SUPER_SEARCH_NEXT_RESULT,
  SUPER_SEARCH_PREVIOUS_RESULT,
  SUPER_SEARCH_TOGGLE_REPLACE_MODE,
  CHANGE_EDITOR_WIDTH_COMMAND,
  SUPER_TOGGLE_TOOLBAR,
  TOGGLE_KEYBOARD_SHORTCUTS_MODAL,
} from './KeyboardCommands'
import { KeyboardKey } from './KeyboardKey'
import { KeyboardModifier, getPrimaryModifier } from './KeyboardModifier'
import { KeyboardShortcut } from './KeyboardShortcut'
import { isMacPlatform } from './platformCheck'

export function getKeyboardShortcuts(platform: Platform, _environment: Environment): KeyboardShortcut[] {
  const primaryModifier = getPrimaryModifier(platform)

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
      command: TOGGLE_DARK_MODE_COMMAND,
      key: 'd',
      modifiers: [primaryModifier, KeyboardModifier.Shift],
      preventDefault: true,
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
    {
      command: SUPER_TOGGLE_TOOLBAR,
      key: 'k',
      modifiers: [primaryModifier, KeyboardModifier.Shift],
    },
    {
      command: SUPER_TOGGLE_SEARCH,
      key: 'f',
      modifiers: [primaryModifier],
    },
    {
      command: SUPER_SEARCH_TOGGLE_REPLACE_MODE,
      key: isMacPlatform(platform) ? undefined : 'h',
      code: isMacPlatform(platform) ? 'KeyF' : undefined,
      modifiers: isMacPlatform(platform) ? [KeyboardModifier.Alt, primaryModifier] : [primaryModifier],
    },
    {
      command: SUPER_SEARCH_TOGGLE_CASE_SENSITIVE,
      key: 'c',
      modifiers: [KeyboardModifier.Alt],
    },
    {
      command: SUPER_SEARCH_NEXT_RESULT,
      key: 'F3',
    },
    {
      command: SUPER_SEARCH_PREVIOUS_RESULT,
      key: 'F3',
      modifiers: [KeyboardModifier.Shift],
    },
    {
      command: SUPER_SHOW_MARKDOWN_PREVIEW,
      key: 'm',
      modifiers: [primaryModifier, KeyboardModifier.Shift],
      preventDefault: true,
    },
    {
      command: OPEN_PREFERENCES_COMMAND,
      key: ',',
      modifiers: [primaryModifier],
      preventDefault: true,
    },
    {
      command: CHANGE_EDITOR_WIDTH_COMMAND,
      key: 'j',
      modifiers: [primaryModifier, KeyboardModifier.Shift],
      preventDefault: true,
    },
    {
      command: TOGGLE_KEYBOARD_SHORTCUTS_MODAL,
      key: '/',
      modifiers: [primaryModifier],
    },
  ]
}

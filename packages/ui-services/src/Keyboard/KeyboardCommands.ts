export type KeyboardCommand = symbol

function createKeyboardCommand(type: string): KeyboardCommand {
  return Symbol(type)
}

export const TOGGLE_LIST_PANE_KEYBOARD_COMMAND = createKeyboardCommand('TOGGLE_LIST_PANE_KEYBOARD_COMMAND')
export const TOGGLE_NAVIGATION_PANE_KEYBOARD_COMMAND = createKeyboardCommand('TOGGLE_NAVIGATION_PANE_KEYBOARD_COMMAND')
export const CREATE_NEW_NOTE_KEYBOARD_COMMAND = createKeyboardCommand('CREATE_NEW_NOTE_KEYBOARD_COMMAND')
export const NEXT_LIST_ITEM_KEYBOARD_COMMAND = createKeyboardCommand('NEXT_LIST_ITEM_KEYBOARD_COMMAND')
export const PREVIOUS_LIST_ITEM_KEYBOARD_COMMAND = createKeyboardCommand('PREVIOUS_LIST_ITEM_KEYBOARD_COMMAND')
export const SEARCH_KEYBOARD_COMMAND = createKeyboardCommand('SEARCH_KEYBOARD_COMMAND')
export const CANCEL_SEARCH_COMMAND = createKeyboardCommand('CANCEL_SEARCH_COMMAND')
export const SELECT_ALL_ITEMS_KEYBOARD_COMMAND = createKeyboardCommand('SELECT_ALL_ITEMS_KEYBOARD_COMMAND')
export const SHOW_HIDDEN_OPTIONS_KEYBOARD_COMMAND = createKeyboardCommand('SHOW_HIDDEN_OPTIONS_KEYBOARD_COMMAND')
export const DELETE_NOTE_KEYBOARD_COMMAND = createKeyboardCommand('DELETE_NOTE_KEYBOARD_COMMAND')
export const TAB_COMMAND = createKeyboardCommand('PLAIN_EDITOR_INSERT_TAB_KEYBOARD_COMMAND')
export const ESCAPE_COMMAND = createKeyboardCommand('ESCAPE_COMMAND')
export const TOGGLE_FOCUS_MODE_COMMAND = createKeyboardCommand('TOGGLE_FOCUS_MODE_COMMAND')
export const TOGGLE_DARK_MODE_COMMAND = createKeyboardCommand('TOGGLE_DARK_MODE_COMMAND')
export const CHANGE_EDITOR_COMMAND = createKeyboardCommand('CHANGE_EDITOR_COMMAND')
export const FOCUS_TAGS_INPUT_COMMAND = createKeyboardCommand('FOCUS_TAGS_INPUT_COMMAND')
export const CREATE_NEW_TAG_COMMAND = createKeyboardCommand('CREATE_NEW_TAG_COMMAND')
export const OPEN_NOTE_HISTORY_COMMAND = createKeyboardCommand('OPEN_NOTE_HISTORY_COMMAND')
export const CAPTURE_SAVE_COMMAND = createKeyboardCommand('CAPTURE_SAVE_COMMAND')
export const STAR_NOTE_COMMAND = createKeyboardCommand('STAR_NOTE_COMMAND')
export const PIN_NOTE_COMMAND = createKeyboardCommand('PIN_NOTE_COMMAND')

export const SUPER_TOGGLE_SEARCH = createKeyboardCommand('SUPER_TOGGLE_SEARCH')
export const SUPER_TOGGLE_TOOLBAR = createKeyboardCommand('SUPER_TOGGLE_TOOLBAR')
export const SUPER_SEARCH_TOGGLE_CASE_SENSITIVE = createKeyboardCommand('SUPER_SEARCH_TOGGLE_CASE_SENSITIVE')
export const SUPER_SEARCH_TOGGLE_REPLACE_MODE = createKeyboardCommand('SUPER_SEARCH_TOGGLE_REPLACE_MODE')
export const SUPER_SEARCH_NEXT_RESULT = createKeyboardCommand('SUPER_SEARCH_NEXT_RESULT')
export const SUPER_SEARCH_PREVIOUS_RESULT = createKeyboardCommand('SUPER_SEARCH_PREVIOUS_RESULT')
export const SUPER_SHOW_MARKDOWN_PREVIEW = createKeyboardCommand('SUPER_SHOW_MARKDOWN_PREVIEW')

export const SUPER_EXPORT_JSON = createKeyboardCommand('SUPER_EXPORT_JSON')
export const SUPER_EXPORT_MARKDOWN = createKeyboardCommand('SUPER_EXPORT_MARKDOWN')
export const OPEN_PREFERENCES_COMMAND = createKeyboardCommand('OPEN_PREFERENCES_COMMAND')

export const CHANGE_EDITOR_WIDTH_COMMAND = createKeyboardCommand('CHANGE_EDITOR_WIDTH_COMMAND')

export const TOGGLE_KEYBOARD_SHORTCUTS_MODAL = createKeyboardCommand('TOGGLE_KEYBOARD_SHORTCUTS_MODAL')

export class KeyboardCommand {
  constructor(public readonly type: string) {}
}

function createKeyboardCommand(type: string): KeyboardCommand {
  return new KeyboardCommand(type)
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
export const PLAIN_EDITOR_INSERT_TAB_COMMAND = createKeyboardCommand('PLAIN_EDITOR_INSERT_TAB_KEYBOARD_COMMAND')
export const CLOSE_PREFERENCES_COMMAND = createKeyboardCommand('CLOSE_PREFERENCES_COMMAND')

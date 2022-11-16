import { BlockPickerOption } from '../BlockPickerOption'
import { LexicalEditor } from 'lexical'
import { INSERT_CHECK_LIST_COMMAND } from '@lexical/list'

export function GetChecklistBlock(editor: LexicalEditor) {
  return new BlockPickerOption('Check List', {
    iconName: 'check',
    keywords: ['check list', 'todo list'],
    onSelect: () => editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined),
  })
}

import { BlockPickerOption } from '../BlockPickerOption'
import { LexicalEditor } from 'lexical'
import { INSERT_ORDERED_LIST_COMMAND } from '@lexical/list'

export function GetNumberedListBlock(editor: LexicalEditor) {
  return new BlockPickerOption('Numbered List', {
    iconName: 'number',
    keywords: ['numbered list', 'ordered list', 'ol'],
    onSelect: () => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined),
  })
}

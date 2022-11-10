import { BlockPickerOption } from '../BlockPickerOption'
import { LexicalEditor } from 'lexical'
import { INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list'

export function GetBulletedListBlock(editor: LexicalEditor) {
  return new BlockPickerOption('Bulleted List', {
    iconName: 'list-ul',
    keywords: ['bulleted list', 'unordered list', 'ul'],
    onSelect: () => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined),
  })
}

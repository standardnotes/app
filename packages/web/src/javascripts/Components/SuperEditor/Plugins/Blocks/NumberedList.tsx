import { LexicalEditor } from 'lexical'
import { INSERT_ORDERED_LIST_COMMAND } from '@lexical/list'

export function GetNumberedListBlock(editor: LexicalEditor) {
  return {
    name: 'Numbered List',
    iconName: 'list-numbered',
    keywords: ['numbered list', 'ordered list', 'ol'],
    onSelect: () => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined),
  }
}

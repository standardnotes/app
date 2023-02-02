import { LexicalEditor } from 'lexical'
import { INSERT_CHECK_LIST_COMMAND } from '@lexical/list'

export function GetChecklistBlock(editor: LexicalEditor) {
  return {
    name: 'Check List',
    iconName: 'check',
    keywords: ['check list', 'todo list'],
    onSelect: () => editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined),
  }
}

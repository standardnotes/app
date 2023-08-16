import { LexicalEditor } from 'lexical'
import { INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list'

export function GetBulletedListBlock(editor: LexicalEditor, isActive = false) {
  return {
    name: 'Bulleted List',
    iconName: 'list-bulleted',
    keywords: ['bulleted list', 'unordered list', 'ul'],
    onSelect: () => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined),
    active: isActive,
  }
}

import { LexicalEditor } from 'lexical'
import { INSERT_UNORDERED_LIST_COMMAND, INSERT_CHECK_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND } from '@lexical/list'
import { BlockPickerOption } from '../BlockPickerPlugin/BlockPickerOption'
import { LexicalIconName } from '@/Components/Icon/LexicalIcons'

export const BulletedListBlock = {
  name: 'Bulleted List',
  iconName: 'list-bulleted' as LexicalIconName,
  keywords: ['bulleted list', 'unordered list', 'ul'],
  onSelect: (editor: LexicalEditor) => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined),
}

export const ChecklistBlock = {
  name: 'Check List',
  iconName: 'list-check' as LexicalIconName,
  keywords: ['check list', 'todo list'],
  onSelect: (editor: LexicalEditor) => editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined),
}

export const NumberedListBlock = {
  name: 'Numbered List',
  iconName: 'list-numbered' as LexicalIconName,
  keywords: ['numbered list', 'ordered list', 'ol'],
  onSelect: (editor: LexicalEditor) => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined),
}

export function GetBulletedListBlockOption(editor: LexicalEditor) {
  return new BlockPickerOption(BulletedListBlock.name, {
    iconName: BulletedListBlock.iconName,
    keywords: BulletedListBlock.keywords,
    onSelect: () => BulletedListBlock.onSelect(editor),
  })
}

export function GetChecklistBlockOption(editor: LexicalEditor) {
  return new BlockPickerOption(ChecklistBlock.name, {
    iconName: ChecklistBlock.iconName,
    keywords: ChecklistBlock.keywords,
    onSelect: () => ChecklistBlock.onSelect(editor),
  })
}

export function GetNumberedListBlockOption(editor: LexicalEditor) {
  return new BlockPickerOption(NumberedListBlock.name, {
    iconName: NumberedListBlock.iconName,
    keywords: NumberedListBlock.keywords,
    onSelect: () => NumberedListBlock.onSelect(editor),
  })
}

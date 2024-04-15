import { BlockPickerOption } from '../BlockPickerPlugin/BlockPickerOption'
import { LexicalEditor } from 'lexical'
import { LexicalIconName } from '@/Components/Icon/LexicalIcons'
import { INSERT_DATETIME_COMMAND } from '../Commands'

export function GetDatetimeBlocks(editor: LexicalEditor) {
  return [
    {
      name: 'Current date and time',
      iconName: 'authenticator',
      keywords: ['date', 'current'],
      onSelect: () => editor.dispatchCommand(INSERT_DATETIME_COMMAND, 'datetime'),
    },
    {
      name: 'Current time',
      iconName: 'authenticator',
      keywords: ['time', 'current'],
      onSelect: () => editor.dispatchCommand(INSERT_DATETIME_COMMAND, 'time'),
    },
    {
      name: 'Current date',
      iconName: 'authenticator',
      keywords: ['date', 'current'],
      onSelect: () => editor.dispatchCommand(INSERT_DATETIME_COMMAND, 'date'),
    },
  ]
}

export function GetDatetimeBlockOptions(editor: LexicalEditor) {
  return GetDatetimeBlocks(editor).map(
    (block) =>
      new BlockPickerOption(block.name, {
        iconName: block.iconName as LexicalIconName,
        keywords: block.keywords,
        onSelect: block.onSelect,
      }),
  )
}

import { LexicalEditor } from 'lexical'
import { INSERT_DATETIME_COMMAND, INSERT_DATE_COMMAND, INSERT_TIME_COMMAND } from '../Commands'

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
      onSelect: () => editor.dispatchCommand(INSERT_TIME_COMMAND, 'datetime'),
    },
    {
      name: 'Current date',
      iconName: 'authenticator',
      keywords: ['date', 'current'],
      onSelect: () => editor.dispatchCommand(INSERT_DATE_COMMAND, 'datetime'),
    },
  ]
}

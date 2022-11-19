import { BlockPickerOption } from '../BlockPickerOption'
import { LexicalEditor } from 'lexical'
import { INSERT_DATETIME_COMMAND, INSERT_DATE_COMMAND, INSERT_TIME_COMMAND } from '../../Commands'

export function GetDatetimeBlocks(editor: LexicalEditor) {
  return [
    new BlockPickerOption('Current date and time', {
      iconName: 'authenticator',
      keywords: ['date', 'current'],
      onSelect: () => editor.dispatchCommand(INSERT_DATETIME_COMMAND, 'datetime'),
    }),
    new BlockPickerOption('Current time', {
      iconName: 'authenticator',
      keywords: ['time', 'current'],
      onSelect: () => editor.dispatchCommand(INSERT_TIME_COMMAND, 'datetime'),
    }),
    new BlockPickerOption('Current date', {
      iconName: 'authenticator',
      keywords: ['date', 'current'],
      onSelect: () => editor.dispatchCommand(INSERT_DATE_COMMAND, 'datetime'),
    }),
  ]
}

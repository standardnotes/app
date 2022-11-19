import { BlockPickerOption } from '../BlockPickerOption'
import { LexicalEditor } from 'lexical'
import { INSERT_PASSWORD_COMMAND } from '../../Commands'

const DEFAULT_PASSWORD_LENGTH = 16
const MIN_PASSWORD_LENGTH = 8

export function GetPasswordBlocks(editor: LexicalEditor) {
  return [
    new BlockPickerOption('Generate cryptographically secure password', {
      iconName: 'password',
      keywords: ['password', 'secure'],
      onSelect: () => editor.dispatchCommand(INSERT_PASSWORD_COMMAND, String(DEFAULT_PASSWORD_LENGTH)),
    }),
  ]
}

export function GetDynamicPasswordBlocks(editor: LexicalEditor, queryString: string) {
  if (queryString == null) {
    return []
  }

  const lengthRegex = /^\d+$/
  const match = lengthRegex.exec(queryString)

  if (!match) {
    return []
  }

  const length = parseInt(match[0], 10)
  if (length < MIN_PASSWORD_LENGTH) {
    return []
  }

  return [
    new BlockPickerOption(`Generate ${length}-character cryptographically secure password`, {
      iconName: 'password',
      keywords: ['password', 'secure'],
      onSelect: () => editor.dispatchCommand(INSERT_PASSWORD_COMMAND, length.toString()),
    }),
  ]
}

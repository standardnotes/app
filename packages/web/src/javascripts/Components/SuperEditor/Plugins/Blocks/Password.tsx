import { BlockPickerOption } from '../BlockPickerPlugin/BlockPickerOption'
import { LexicalEditor } from 'lexical'
import { INSERT_PASSWORD_COMMAND } from '../Commands'
import { LexicalIconName } from '@/Components/Icon/LexicalIcons'

const MIN_PASSWORD_LENGTH = 8
const DEFAULT_PASSWORD_LENGTH = 16

export const PasswordBlock = {
  name: 'Generate cryptographically secure password',
  iconName: 'password',
  keywords: ['password', 'secure'],
  onSelect: (editor: LexicalEditor) => editor.dispatchCommand(INSERT_PASSWORD_COMMAND, String(DEFAULT_PASSWORD_LENGTH)),
}

export function GetPasswordBlockOption(editor: LexicalEditor) {
  return new BlockPickerOption(PasswordBlock.name, {
    iconName: PasswordBlock.iconName as LexicalIconName,
    keywords: PasswordBlock.keywords,
    onSelect: () => PasswordBlock.onSelect(editor),
  })
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

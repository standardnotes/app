import { BlockPickerOption } from '../BlockPickerOption'
import { LexicalEditor } from 'lexical'
import { INSERT_PASSWORD_COMMAND } from '../../Commands'
import { GetPasswordBlock } from '../../Blocks/Password'
import { LexicalIconName } from '@/Components/Icon/LexicalIcons'

const MIN_PASSWORD_LENGTH = 8

export function GetPasswordBlockOption(editor: LexicalEditor) {
  const block = GetPasswordBlock(editor)
  return new BlockPickerOption(block.name, {
    iconName: block.iconName as LexicalIconName,
    keywords: block.keywords,
    onSelect: block.onSelect,
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

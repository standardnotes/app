import { LexicalEditor } from 'lexical'
import { INSERT_PASSWORD_COMMAND } from '../Commands'

const DEFAULT_PASSWORD_LENGTH = 16

export function GetPasswordBlock(editor: LexicalEditor) {
  return {
    name: 'Generate cryptographically secure password',
    iconName: 'password',
    keywords: ['password', 'secure'],
    onSelect: () => editor.dispatchCommand(INSERT_PASSWORD_COMMAND, String(DEFAULT_PASSWORD_LENGTH)),
  }
}

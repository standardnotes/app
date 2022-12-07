import { BlockPickerOption } from '../BlockPickerOption'
import { INDENT_CONTENT_COMMAND, OUTDENT_CONTENT_COMMAND, LexicalEditor } from 'lexical'

export function GetIndentOutdentBlocks(editor: LexicalEditor) {
  return [
    new BlockPickerOption('Indent', {
      iconName: 'arrow-right',
      keywords: ['indent'],
      onSelect: () => editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined),
    }),
    new BlockPickerOption('Outdent', {
      iconName: 'arrow-left',
      keywords: ['outdent'],
      onSelect: () => editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined),
    }),
  ]
}

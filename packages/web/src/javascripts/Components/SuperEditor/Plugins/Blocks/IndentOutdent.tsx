import { INDENT_CONTENT_COMMAND, OUTDENT_CONTENT_COMMAND, LexicalEditor } from 'lexical'
import { BlockPickerOption } from '../BlockPickerPlugin/BlockPickerOption'
import { LexicalIconName } from '@/Components/Icon/LexicalIcons'

export const IndentBlock = {
  name: 'Indent',
  iconName: 'indent',
  keywords: ['indent'],
  onSelect: (editor: LexicalEditor) => editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined),
}

export const OutdentBlock = {
  name: 'Outdent',
  iconName: 'outdent',
  keywords: ['outdent'],
  onSelect: (editor: LexicalEditor) => editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined),
}

export function GetIndentBlockOption(editor: LexicalEditor) {
  return new BlockPickerOption(IndentBlock.name, {
    iconName: IndentBlock.iconName as LexicalIconName,
    keywords: IndentBlock.keywords,
    onSelect: () => IndentBlock.onSelect(editor),
  })
}

export function GetOutdentBlockOption(editor: LexicalEditor) {
  return new BlockPickerOption(OutdentBlock.name, {
    iconName: OutdentBlock.iconName as LexicalIconName,
    keywords: OutdentBlock.keywords,
    onSelect: () => OutdentBlock.onSelect(editor),
  })
}

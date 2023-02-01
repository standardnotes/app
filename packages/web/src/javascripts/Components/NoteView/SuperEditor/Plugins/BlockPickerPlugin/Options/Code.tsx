import { BlockPickerOption } from '../BlockPickerOption'
import { LexicalEditor } from 'lexical'
import { GetCodeBlock } from '../../Blocks/Code'

export function GetCodeBlockOption(editor: LexicalEditor) {
  const block = GetCodeBlock(editor)
  return new BlockPickerOption(block.name, {
    iconName: block.iconName,
    keywords: block.keywords,
    onSelect: block.onSelect,
  })
}

import { BlockPickerOption } from '../BlockPickerOption'
import { LexicalEditor } from 'lexical'
import { GetCollapsibleBlock } from '../../Blocks/Collapsible'

export function GetCollapsibleBlockOption(editor: LexicalEditor) {
  const block = GetCollapsibleBlock(editor)
  return new BlockPickerOption(block.name, {
    iconName: block.iconName,
    keywords: block.keywords,
    onSelect: block.onSelect,
  })
}

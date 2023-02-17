import { BlockPickerOption } from '../BlockPickerOption'
import { LexicalEditor } from 'lexical'
import { GetQuoteBlock } from '../../Blocks/Quote'
import { LexicalIconName } from '@/Components/Icon/LexicalIcons'

export function GetQuoteBlockOption(editor: LexicalEditor) {
  const block = GetQuoteBlock(editor)
  return new BlockPickerOption(block.name, {
    iconName: block.iconName as LexicalIconName,
    keywords: block.keywords,
    onSelect: block.onSelect,
  })
}

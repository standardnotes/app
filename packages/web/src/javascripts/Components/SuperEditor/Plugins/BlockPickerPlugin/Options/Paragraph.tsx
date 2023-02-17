import { BlockPickerOption } from '../BlockPickerOption'
import { LexicalEditor } from 'lexical'
import { GetParagraphBlock } from '../../Blocks/Paragraph'
import { LexicalIconName } from '@/Components/Icon/LexicalIcons'

export function GetParagraphBlockOption(editor: LexicalEditor) {
  const block = GetParagraphBlock(editor)
  return new BlockPickerOption(block.name, {
    iconName: block.iconName as LexicalIconName,
    keywords: block.keywords,
    onSelect: block.onSelect,
  })
}

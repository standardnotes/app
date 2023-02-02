import { BlockPickerOption } from '../BlockPickerOption'
import { LexicalEditor } from 'lexical'
import { GetNumberedListBlock } from '../../Blocks/NumberedList'
import { LexicalIconName } from '@/Components/Icon/LexicalIcons'

export function GetNumberedListBlockOption(editor: LexicalEditor) {
  const block = GetNumberedListBlock(editor)
  return new BlockPickerOption(block.name, {
    iconName: block.iconName as LexicalIconName,
    keywords: block.keywords,
    onSelect: block.onSelect,
  })
}

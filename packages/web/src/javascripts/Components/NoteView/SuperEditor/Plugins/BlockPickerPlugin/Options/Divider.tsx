import { BlockPickerOption } from '../BlockPickerOption'
import { LexicalEditor } from 'lexical'
import { GetDividerBlock } from '../../Blocks/Divider'
import { LexicalIconName } from '@/Components/Icon/LexicalIcons'

export function GetDividerBlockOption(editor: LexicalEditor) {
  const block = GetDividerBlock(editor)
  return new BlockPickerOption(block.name, {
    iconName: block.iconName as LexicalIconName,
    keywords: block.keywords,
    onSelect: block.onSelect,
  })
}

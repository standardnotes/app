import { BlockPickerOption } from '../BlockPickerOption'
import { LexicalEditor } from 'lexical'
import { GetDatetimeBlocks } from '../../Blocks/DateTime'
import { LexicalIconName } from '@/Components/Icon/LexicalIcons'

export function GetDatetimeBlockOptions(editor: LexicalEditor) {
  return GetDatetimeBlocks(editor).map(
    (block) =>
      new BlockPickerOption(block.name, {
        iconName: block.iconName as LexicalIconName,
        keywords: block.keywords,
        onSelect: block.onSelect,
      }),
  )
}

import { BlockPickerOption } from '../BlockPickerOption'
import { LexicalEditor } from 'lexical'
import { GetIndentOutdentBlocks } from '../../Blocks/IndentOutdent'
import { LexicalIconName } from '@/Components/Icon/LexicalIcons'

export function GetIndentOutdentBlockOptions(editor: LexicalEditor) {
  return GetIndentOutdentBlocks(editor).map(
    (block) =>
      new BlockPickerOption(block.name, {
        iconName: block.iconName as LexicalIconName,
        keywords: block.keywords,
        onSelect: block.onSelect,
      }),
  )
}

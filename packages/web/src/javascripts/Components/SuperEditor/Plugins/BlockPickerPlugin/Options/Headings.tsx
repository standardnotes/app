import { BlockPickerOption } from '../BlockPickerOption'
import { LexicalEditor } from 'lexical'
import { LexicalIconName } from '@/Components/Icon/LexicalIcons'
import { GetHeadingsBlocks } from '../../Blocks/Headings'

export function GetHeadingsBlockOptions(editor: LexicalEditor) {
  return GetHeadingsBlocks(editor).map(
    (block) =>
      new BlockPickerOption(block.name, {
        iconName: block.iconName as LexicalIconName,
        keywords: block.keywords,
        onSelect: block.onSelect,
      }),
  )
}

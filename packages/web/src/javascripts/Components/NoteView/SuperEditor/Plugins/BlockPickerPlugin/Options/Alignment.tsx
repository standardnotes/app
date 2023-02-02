import { BlockPickerOption } from '../BlockPickerOption'
import { LexicalEditor } from 'lexical'
import { GetAlignmentBlocks } from '../../Blocks/Alignment'

export function GetAlignmentBlockOptions(editor: LexicalEditor) {
  return GetAlignmentBlocks(editor).map(
    (block) =>
      new BlockPickerOption(block.name, {
        iconName: block.iconName,
        keywords: block.keywords,
        onSelect: block.onSelect,
      }),
  )
}

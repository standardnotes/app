import { $setBlocksType } from '@lexical/selection'
import { $createParagraphNode, $getSelection, $isRangeSelection, LexicalEditor } from 'lexical'
import { BlockPickerOption } from '../BlockPickerPlugin/BlockPickerOption'
import { LexicalIconName } from '@/Components/Icon/LexicalIcons'

export const ParagraphBlock = {
  name: 'Paragraph',
  iconName: 'paragraph',
  keywords: ['normal', 'paragraph', 'p', 'text'],
  onSelect: (editor: LexicalEditor) =>
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode())
      }
    }),
}

export function GetParagraphBlockOption(editor: LexicalEditor) {
  return new BlockPickerOption(ParagraphBlock.name, {
    iconName: ParagraphBlock.iconName as LexicalIconName,
    keywords: ParagraphBlock.keywords,
    onSelect: () => ParagraphBlock.onSelect(editor),
  })
}

import { BlockPickerOption } from '../BlockPickerOption'
import { $wrapNodes } from '@lexical/selection'
import { $getSelection, $isRangeSelection, LexicalEditor } from 'lexical'
import { $createHeadingNode, HeadingTagType } from '@lexical/rich-text'
import { LexicalIconName } from '@/Components/Icon/LexicalIcons'

export function GetHeadingsBlocks(editor: LexicalEditor) {
  return Array.from({ length: 3 }, (_, i) => i + 1).map(
    (n) =>
      new BlockPickerOption(`Heading ${n}`, {
        iconName: `h${n}` as LexicalIconName,
        keywords: ['heading', 'header', `h${n}`],
        onSelect: () =>
          editor.update(() => {
            const selection = $getSelection()
            if ($isRangeSelection(selection)) {
              $wrapNodes(selection, () => $createHeadingNode(`h${n}` as HeadingTagType))
            }
          }),
      }),
  )
}

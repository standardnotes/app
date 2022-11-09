import { BlockPickerOption } from '../BlockPickerOption'
import { $wrapNodes } from '@lexical/selection'
import { $createParagraphNode, $getSelection, $isRangeSelection, LexicalEditor } from 'lexical'

export function GetParagraphBlock(editor: LexicalEditor) {
  return new BlockPickerOption('Paragraph', {
    iconName: 'paragraph',
    keywords: ['normal', 'paragraph', 'p', 'text'],
    onSelect: () =>
      editor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createParagraphNode())
        }
      }),
  })
}

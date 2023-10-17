import { $setBlocksType } from '@lexical/selection'
import { $getSelection, $isRangeSelection, LexicalEditor } from 'lexical'
import { $createQuoteNode } from '@lexical/rich-text'
import { BlockPickerOption } from '../BlockPickerPlugin/BlockPickerOption'
import { LexicalIconName } from '@/Components/Icon/LexicalIcons'

export const QuoteBlock = {
  name: 'Quote',
  iconName: 'quote' as LexicalIconName,
  keywords: ['block quote'],
  onSelect: (editor: LexicalEditor) =>
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createQuoteNode())
      }
    }),
}

export function GetQuoteBlockOption(editor: LexicalEditor) {
  return new BlockPickerOption(QuoteBlock.name, {
    iconName: QuoteBlock.iconName,
    keywords: QuoteBlock.keywords,
    onSelect: () => QuoteBlock.onSelect(editor),
  })
}

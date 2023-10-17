import { $setBlocksType } from '@lexical/selection'
import { $getSelection, $isRangeSelection, LexicalEditor } from 'lexical'
import { $createHeadingNode } from '@lexical/rich-text'
import { LexicalIconName } from '@/Components/Icon/LexicalIcons'
import { BlockPickerOption } from '../BlockPickerPlugin/BlockPickerOption'

export const H1Block = {
  name: 'Heading 1',
  iconName: 'h1',
  keywords: ['heading', 'header', 'h1'],
  onSelect: (editor: LexicalEditor) =>
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode('h1'))
      }
    }),
}

export function GetH1BlockOption(editor: LexicalEditor) {
  return new BlockPickerOption(H1Block.name, {
    iconName: H1Block.iconName as LexicalIconName,
    keywords: H1Block.keywords,
    onSelect: () => H1Block.onSelect(editor),
  })
}

export const H2Block = {
  name: 'Heading 2',
  iconName: 'h2',
  keywords: ['heading', 'header', 'h2'],
  onSelect: (editor: LexicalEditor) =>
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode('h2'))
      }
    }),
}

export function GetH2BlockOption(editor: LexicalEditor) {
  return new BlockPickerOption(H2Block.name, {
    iconName: H2Block.iconName as LexicalIconName,
    keywords: H2Block.keywords,
    onSelect: () => H2Block.onSelect(editor),
  })
}

export const H3Block = {
  name: 'Heading 3',
  iconName: 'h3',
  keywords: ['heading', 'header', 'h3'],
  onSelect: (editor: LexicalEditor) =>
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode('h3'))
      }
    }),
}

export function GetH3BlockOption(editor: LexicalEditor) {
  return new BlockPickerOption(H3Block.name, {
    iconName: H3Block.iconName as LexicalIconName,
    keywords: H3Block.keywords,
    onSelect: () => H3Block.onSelect(editor),
  })
}

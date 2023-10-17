import { $setBlocksType } from '@lexical/selection'
import { $getSelection, $isRangeSelection, LexicalEditor } from 'lexical'
import { $createCodeNode } from '@lexical/code'
import { LexicalIconName } from '@/Components/Icon/LexicalIcons'
import { BlockPickerOption } from '../BlockPickerPlugin/BlockPickerOption'

export const CodeBlock = {
  name: 'Code Block',
  iconName: 'code' as LexicalIconName,
  keywords: ['javascript', 'python', 'js', 'codeblock'],
  onSelect: (editor: LexicalEditor) =>
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        if (selection.isCollapsed()) {
          $setBlocksType(selection, () => $createCodeNode())
        } else {
          const textContent = selection.getTextContent()
          const codeNode = $createCodeNode()
          selection.insertNodes([codeNode])
          selection.insertRawText(textContent)
        }
      }
    }),
}

export function GetCodeBlockOption(editor: LexicalEditor) {
  return new BlockPickerOption(CodeBlock.name, {
    iconName: CodeBlock.iconName,
    keywords: CodeBlock.keywords,
    onSelect: () => CodeBlock.onSelect(editor),
  })
}

import { $wrapNodes } from '@lexical/selection'
import { $getSelection, $isRangeSelection, LexicalEditor } from 'lexical'
import { $createCodeNode } from '@lexical/code'
import { LexicalIconName } from '@/Components/Icon/LexicalIcons'

export function GetCodeBlock(editor: LexicalEditor) {
  return {
    name: 'Code',
    iconName: 'lexical-code' as LexicalIconName,
    keywords: ['javascript', 'python', 'js', 'codeblock'],
    onSelect: () =>
      editor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          if (selection.isCollapsed()) {
            $wrapNodes(selection, () => $createCodeNode())
          } else {
            const textContent = selection.getTextContent()
            const codeNode = $createCodeNode()
            selection.insertNodes([codeNode])
            selection.insertRawText(textContent)
          }
        }
      }),
  }
}

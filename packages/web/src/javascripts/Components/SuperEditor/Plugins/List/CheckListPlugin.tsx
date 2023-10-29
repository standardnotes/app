import { CheckListPlugin as LexicalCheckListPlugin } from '@lexical/react/LexicalCheckListPlugin'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { ListNode } from '@lexical/list'
import { useEffect } from 'react'

export function CheckListPlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerNodeTransform(ListNode, (node) => {
      if (node.getListType() !== 'check') {
        return
      }
      editor.getEditorState().read(() => {
        const element = editor.getElementByKey(node.getKey())
        if (!element) {
          return
        }
        element.classList.add('Lexical__checkList')
      })
    })
  }, [editor])

  return <LexicalCheckListPlugin />
}

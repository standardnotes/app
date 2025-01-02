import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect } from 'react'
import { $createCodeNode } from '@lexical/code'
import { $createTextNode, $getRoot, $isParagraphNode } from 'lexical'
import { MarkdownTransformers } from '../../MarkdownTransformers'
import { $dfs } from '@lexical/utils'
import { $convertToMarkdownString } from '../../Lexical/Utils/MarkdownExport'

type Props = {
  onMarkdown: (markdown: string) => void
}

export default function MarkdownPreviewPlugin({ onMarkdown }: Props): JSX.Element | null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    editor.update(() => {
      const root = $getRoot()
      for (const { node } of $dfs()) {
        if (!$isParagraphNode(node)) {
          continue
        }
        if (node.isEmpty()) {
          node.remove()
        }
      }
      const markdown = $convertToMarkdownString(MarkdownTransformers)
      root.clear().append($createCodeNode('markdown').append($createTextNode(markdown)))
      root.selectEnd()
      onMarkdown(markdown)
    })
  }, [editor, onMarkdown])

  return null
}

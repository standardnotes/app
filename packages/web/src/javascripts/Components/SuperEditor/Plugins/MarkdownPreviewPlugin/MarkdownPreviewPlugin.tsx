import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect } from 'react'
import { $createCodeNode } from '@lexical/code'
import { $createTextNode, $getRoot, $nodesOfType, ParagraphNode } from 'lexical'
import { $convertToMarkdownString } from '@lexical/markdown'
import { MarkdownTransformers } from '../../MarkdownTransformers'

type Props = {
  onMarkdown: (markdown: string) => void
}

export default function MarkdownPreviewPlugin({ onMarkdown }: Props): JSX.Element | null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    editor.update(() => {
      const root = $getRoot()
      const paragraphs = $nodesOfType(ParagraphNode)
      for (const paragraph of paragraphs) {
        if (paragraph.isEmpty()) {
          paragraph.remove()
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

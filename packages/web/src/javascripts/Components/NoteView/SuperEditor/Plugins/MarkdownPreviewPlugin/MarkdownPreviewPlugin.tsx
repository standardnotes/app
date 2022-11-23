import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect } from 'react'
import { $createCodeNode } from '@lexical/code'
import { $createTextNode, $getRoot } from 'lexical'
import { $convertToMarkdownString } from '@lexical/markdown'
import { MarkdownTransformers } from '@standardnotes/blocks-editor'

type Props = {
  onMarkdown: (markdown: string) => void
}

export default function MarkdownPreviewPlugin({ onMarkdown }: Props): JSX.Element | null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    editor.update(() => {
      const root = $getRoot()
      const markdown = $convertToMarkdownString(MarkdownTransformers)
      root.clear().append($createCodeNode('markdown').append($createTextNode(markdown)))
      root.selectEnd()
      onMarkdown(markdown)
    })
  }, [editor, onMarkdown])

  return null
}

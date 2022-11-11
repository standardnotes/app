import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect } from 'react'
import { $convertFromMarkdownString, TRANSFORMERS } from '@lexical/markdown'

export default function ImportPlugin({ text }: { text: string }): JSX.Element | null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    editor.update(() => {
      $convertFromMarkdownString(text, [...TRANSFORMERS])
    })
  }, [editor, text])

  return null
}

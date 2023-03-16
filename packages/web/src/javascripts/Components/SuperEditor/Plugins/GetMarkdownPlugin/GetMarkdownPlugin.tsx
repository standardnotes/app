import { forwardRef, useCallback, useImperativeHandle } from 'react'
import { $convertToMarkdownString } from '@lexical/markdown'
import { MarkdownTransformers } from '../../MarkdownTransformers'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'

export type GetMarkdownPluginInterface = {
  getMarkdown: () => string
}

const GetMarkdownPlugin = forwardRef<GetMarkdownPluginInterface>((_, ref) => {
  const [editor] = useLexicalComposerContext()

  useImperativeHandle(ref, () => ({
    getMarkdown() {
      return getMarkdown()
    },
  }))

  const getMarkdown = useCallback(() => {
    return editor.getEditorState().read(() => {
      return $convertToMarkdownString(MarkdownTransformers)
    })
  }, [editor])

  return null
})

export default GetMarkdownPlugin

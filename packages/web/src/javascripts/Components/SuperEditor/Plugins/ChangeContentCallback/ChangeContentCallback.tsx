import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect } from 'react'

export type ChangeEditorFunction = (jsonContent: string) => void
type ChangeEditorFunctionProvider = (changeEditorFunction: ChangeEditorFunction) => void

export function ChangeContentCallbackPlugin({
  providerCallback,
}: {
  providerCallback: ChangeEditorFunctionProvider
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    const changeContents: ChangeEditorFunction = (jsonContent: string) => {
      editor.update(() => {
        const editorState = editor.parseEditorState(jsonContent)
        editor.setEditorState(editorState)
      })
    }

    providerCallback(changeContents)
  }, [editor, providerCallback])

  return null
}

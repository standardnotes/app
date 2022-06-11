import './styles.scss'

import { basicSetup } from '@codemirror/basic-setup'
import { markdown } from '@codemirror/lang-markdown'
import CodeMirrorReact, { EditorView, ReactCodeMirrorRef } from '@uiw/react-codemirror'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

export type CodeMirrorRef = {
  update: (markdown: string) => void
}

type CodeMirrorProps = {
  onChange: (text: string) => void
  value?: string
  editable: boolean
  spellcheck: boolean
}

const CodeMirror = (
  { onChange, value, editable, spellcheck }: CodeMirrorProps,
  ref: React.ForwardedRef<CodeMirrorRef>,
) => {
  const [hasFocus, setFocus] = useState(false)
  const editorRef = useRef<ReactCodeMirrorRef>(null)
  const extensions = [
    basicSetup,
    markdown(),
    EditorView.lineWrapping,
    EditorView.updateListener.of((update) => {
      if (update.focusChanged) {
        setFocus(update.view.hasFocus)
      }

      if (update.docChanged) {
        const text = update.state.doc.toString()
        onChange(text)
      }
    }),
  ]

  useImperativeHandle(ref, () => ({
    update: (markdown: string) => {
      /**
       * This will prevent the CodeMirror editor from being updated again when an update
       * is sent back from the Milkdown editor.
       */
      if (hasFocus) {
        return
      }

      if (!editable || !editorRef.current) {
        return
      }

      const view = editorRef.current.view
      if (!view) {
        return
      }

      const { state } = view
      if (!state) {
        return
      }

      const document = state.doc
      if (!document) {
        return
      }

      view.dispatch({
        changes: {
          from: 0,
          to: document.toString().length,
          insert: markdown,
        },
      })
    },
  }))

  return (
    <div className="codemirror-container">
      <CodeMirrorReact
        ref={editorRef}
        extensions={extensions}
        value={value}
        editable={editable}
        spellCheck={spellcheck}
        indentWithTab
      />
    </div>
  )
}

export default forwardRef<CodeMirrorRef, CodeMirrorProps>(CodeMirror)

import { createHeadlessEditor } from '@lexical/headless'
import { $convertToMarkdownString } from '@lexical/markdown'
import { MarkdownTransformers } from '@standardnotes/blocks-editor'
import { $generateHtmlFromNodes } from '@lexical/html'
import { BlockEditorNodes } from '@standardnotes/blocks-editor/src/Lexical/Nodes/AllNodes'
import BlocksEditorTheme from '@standardnotes/blocks-editor/src/Lexical/Theme/Theme'
import { SNNote } from '@standardnotes/models'
import { SuperEditorNodes } from './SuperEditorNodes'

export const exportSuperNote = (note: SNNote, format: 'txt' | 'md' | 'html' | 'json') => {
  const headlessEditor = createHeadlessEditor({
    namespace: 'BlocksEditor',
    theme: BlocksEditorTheme,
    editable: false,
    onError: (error: Error) => console.error(error),
    nodes: [...SuperEditorNodes, ...BlockEditorNodes],
  })

  headlessEditor.setEditorState(headlessEditor.parseEditorState(note.text))

  let content: string | undefined

  headlessEditor.update(() => {
    switch (format) {
      case 'md':
        content = $convertToMarkdownString(MarkdownTransformers)
        break
      case 'html':
        content = $generateHtmlFromNodes(headlessEditor)
        break
      case 'json':
        content = JSON.stringify(headlessEditor.toJSON())
        break
      case 'txt':
      default:
        content = note.text
        break
    }
  })

  if (!content) {
    throw new Error('Could not export note')
  }

  return content
}

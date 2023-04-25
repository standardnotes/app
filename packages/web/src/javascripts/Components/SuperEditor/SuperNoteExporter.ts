import { createHeadlessEditor } from '@lexical/headless'
import { $convertToMarkdownString } from '@lexical/markdown'
import { MarkdownTransformers } from './MarkdownTransformers'
import { $generateHtmlFromNodes } from '@lexical/html'
import { BlockEditorNodes } from './Lexical/Nodes/AllNodes'
import BlocksEditorTheme from './Lexical/Theme/Theme'
import { SNNote } from '@standardnotes/models'

export const exportSuperNote = (note: SNNote, format: 'txt' | 'md' | 'html' | 'json') => {
  const headlessEditor = createHeadlessEditor({
    namespace: 'BlocksEditor',
    theme: BlocksEditorTheme,
    editable: false,
    onError: (error: Error) => console.error(error),
    nodes: [...BlockEditorNodes],
  })

  headlessEditor.setEditorState(headlessEditor.parseEditorState(note.text))

  let content: string | undefined

  headlessEditor.update(() => {
    switch (format) {
      case 'txt':
      case 'md':
        content = $convertToMarkdownString(MarkdownTransformers)
        break
      case 'html':
        content = $generateHtmlFromNodes(headlessEditor)
        break
      case 'json':
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

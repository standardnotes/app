// import { PrefDefaults } from '@/Constants/PrefDefaults'
// import { classNames } from '@/Utils/ConcatenateClassNames'
// import { getPlaintextFontSize } from '@/Utils/getPlaintextFontSize'
// import { PrefKey } from '@standardnotes/snjs'
import { FunctionComponent, useCallback, useEffect } from 'react'
import { ManagedBlockComponentInterface } from './BlockComponentInterface'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin'
import { ClearEditorPlugin } from '@lexical/react/LexicalClearEditorPlugin'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'
import { CHECK_LIST, ELEMENT_TRANSFORMERS, TEXT_FORMAT_TRANSFORMERS, TEXT_MATCH_TRANSFORMERS } from '@lexical/markdown'

import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'
import { HashtagPlugin } from '@lexical/react/LexicalHashtagPlugin'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { ListNode, ListItemNode } from '@lexical/list'
import { CodeHighlightNode, CodeNode } from '@lexical/code'
import { HashtagNode } from '@lexical/hashtag'
import { AutoLinkNode, LinkNode } from '@lexical/link'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'

import ComponentPickerPlugin from '../Lexical/Plugins/ComponentPickerPlugin'
import theme from '../Lexical/Theme'

import { EditorState, LexicalEditor } from 'lexical'

// const StringEllipses = '...'
// const NotePreviewCharLimit = 160

// Lexical React plugins are React components, which makes them
// highly composable. Furthermore, you can lazy load plugins if
// desired, so you don't pay the cost for plugins until you
// actually use them.
// function MyCustomAutoFocusPlugin() {
//   const [editor] = useLexicalComposerContext()

//   useEffect(() => {
//     // Focus the editor when the effect fires!
//     editor.focus()
//     console.log('inserting chekclist')
//     editor.update(() => {
//       // Get the RootNode from the EditorState
//       const root = $getRoot()

//       // Create a new ParagraphNode
//       const paragraphNode = $createListNode('check')

//       // Finally, append the paragraph to the root
//       root.append(paragraphNode)
//     })
//   }, [editor])

//   return null
// }

export const BlockquoteBlock: FunctionComponent<ManagedBlockComponentInterface> = ({
  block,
  // note,
  // application,
  // onFocus,
  // onBlur,
  onChange,
}) => {
  const handleChange = useCallback(
    (editorState: EditorState, editor: LexicalEditor) => {
      const stringifiedEditorState = JSON.stringify(editor.getEditorState().toJSON())

      const content = stringifiedEditorState
      // const truncate = content.length > NotePreviewCharLimit
      // const substring = content.substring(0, NotePreviewCharLimit)
      // const previewPlain = substring + (truncate ? StringEllipses : '')
      onChange({ content, previewPlain: '', previewHtml: undefined })
    },
    [onChange],
  )

  return (
    <LexicalComposer
      initialConfig={{
        namespace: 'MyEditor',
        theme,
        onError: (error: Error) => console.error(error),
        editorState: block.content && block.content.length > 0 ? block.content : undefined,
        nodes: [
          ListNode,
          ListItemNode,
          HeadingNode,
          ListNode,
          ListItemNode,
          QuoteNode,
          CodeNode,
          HashtagNode,
          CodeHighlightNode,
          AutoLinkNode,
          LinkNode,
        ],
      }}
    >
      <RichTextPlugin
        contentEditable={
          <ContentEditable className="ContentEditable__root bullet [&>ul]:p-revert relative min-h-[250px] resize-none text-base focus:shadow-none focus:outline-none [&>ul]:list-inside " />
        }
        placeholder=""
        ErrorBoundary={LexicalErrorBoundary}
      />
      <ListPlugin />
      <MarkdownShortcutPlugin
        transformers={[CHECK_LIST, ...ELEMENT_TRANSFORMERS, ...TEXT_FORMAT_TRANSFORMERS, ...TEXT_MATCH_TRANSFORMERS]}
      />
      <OnChangePlugin onChange={handleChange} />
      <HistoryPlugin />
      <AutoFocusPlugin />
      <ComponentPickerPlugin />
      <ClearEditorPlugin />
      <CheckListPlugin />
      <LinkPlugin />
      <HashtagPlugin />
    </LexicalComposer>
  )
}

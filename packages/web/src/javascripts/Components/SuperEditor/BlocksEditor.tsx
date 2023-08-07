import { FunctionComponent, UIEventHandler, useCallback, useState } from 'react'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin'
import { ClearEditorPlugin } from '@lexical/react/LexicalClearEditorPlugin'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'
import { TablePlugin } from '@lexical/react/LexicalTablePlugin'
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'
import { HashtagPlugin } from '@lexical/react/LexicalHashtagPlugin'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { EditorState, LexicalEditor } from 'lexical'
import HorizontalRulePlugin from './Plugins/HorizontalRulePlugin'
import TwitterPlugin from './Plugins/TwitterPlugin'
import YouTubePlugin from './Plugins/YouTubePlugin'
import AutoEmbedPlugin from './Plugins/AutoEmbedPlugin'
import CollapsiblePlugin from './Plugins/CollapsiblePlugin'
import DraggableBlockPlugin from './Plugins/DraggableBlockPlugin'
import CodeHighlightPlugin from './Plugins/CodeHighlightPlugin'
import FloatingTextFormatToolbarPlugin from './Plugins/FloatingTextFormatToolbarPlugin'
import { TabIndentationPlugin } from './Plugins/TabIndentationPlugin'
import { handleEditorChange } from './Utils'
import { SuperEditorContentId } from './Constants'
import { classNames } from '@standardnotes/utils'
import { MarkdownTransformers } from './MarkdownTransformers'
import { RemoveBrokenTablesPlugin } from './Plugins/TablePlugin'

type BlocksEditorProps = {
  onChange?: (value: string, preview: string) => void
  className?: string
  children?: React.ReactNode
  previewLength?: number
  spellcheck?: boolean
  ignoreFirstChange?: boolean
  readonly?: boolean
  onScroll?: UIEventHandler
}

export const BlocksEditor: FunctionComponent<BlocksEditorProps> = ({
  onChange,
  className,
  children,
  previewLength,
  spellcheck,
  ignoreFirstChange = false,
  readonly,
  onScroll,
}) => {
  const [didIgnoreFirstChange, setDidIgnoreFirstChange] = useState(false)
  const handleChange = useCallback(
    (editorState: EditorState, _editor: LexicalEditor) => {
      if (ignoreFirstChange && !didIgnoreFirstChange) {
        setDidIgnoreFirstChange(true)
        return
      }

      editorState.read(() => {
        handleEditorChange(editorState, previewLength, onChange)
      })
    },
    [ignoreFirstChange, didIgnoreFirstChange, previewLength, onChange],
  )

  const [floatingAnchorElem, setFloatingAnchorElem] = useState<HTMLDivElement | null>(null)

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem)
    }
  }

  return (
    <>
      <RichTextPlugin
        contentEditable={
          <div id="blocks-editor" className="editor-scroller h-full min-h-0">
            <div className="editor z-0 overflow-hidden" ref={onRef}>
              <ContentEditable
                id={SuperEditorContentId}
                className={classNames('ContentEditable__root overflow-y-auto', className)}
                spellCheck={spellcheck}
                onScroll={onScroll}
              />
              <div className="search-highlight-container pointer-events-none absolute left-0 top-0 h-full w-full" />
            </div>
          </div>
        }
        placeholder={null}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <ListPlugin />
      <MarkdownShortcutPlugin transformers={MarkdownTransformers} />
      <TablePlugin />
      <OnChangePlugin onChange={handleChange} ignoreSelectionChange={true} />
      <HistoryPlugin />
      <HorizontalRulePlugin />
      <ClearEditorPlugin />
      <CheckListPlugin />
      <CodeHighlightPlugin />
      <LinkPlugin />
      <HashtagPlugin />
      <AutoEmbedPlugin />
      <TwitterPlugin />
      <YouTubePlugin />
      <CollapsiblePlugin />
      <TabIndentationPlugin />
      <RemoveBrokenTablesPlugin />
      {!readonly && floatingAnchorElem && (
        <>
          <FloatingTextFormatToolbarPlugin anchorElem={floatingAnchorElem} />
          <DraggableBlockPlugin anchorElem={floatingAnchorElem} />
        </>
      )}
      {children}
    </>
  )
}

import {FunctionComponent, useCallback, useState} from 'react';
import {RichTextPlugin} from '@lexical/react/LexicalRichTextPlugin';
import {ContentEditable} from '@lexical/react/LexicalContentEditable';
import {OnChangePlugin} from '@lexical/react/LexicalOnChangePlugin';
import {AutoFocusPlugin} from '@lexical/react/LexicalAutoFocusPlugin';
import {CheckListPlugin} from '@lexical/react/LexicalCheckListPlugin';
import {ClearEditorPlugin} from '@lexical/react/LexicalClearEditorPlugin';
import {MarkdownShortcutPlugin} from '@lexical/react/LexicalMarkdownShortcutPlugin';
import {TablePlugin} from '@lexical/react/LexicalTablePlugin';
import {
  CHECK_LIST,
  ELEMENT_TRANSFORMERS,
  TEXT_FORMAT_TRANSFORMERS,
  TEXT_MATCH_TRANSFORMERS,
} from '@lexical/markdown';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import {HashtagPlugin} from '@lexical/react/LexicalHashtagPlugin';
import {HistoryPlugin} from '@lexical/react/LexicalHistoryPlugin';
import {LinkPlugin} from '@lexical/react/LexicalLinkPlugin';
import {ListPlugin} from '@lexical/react/LexicalListPlugin';
import {EditorState, LexicalEditor} from 'lexical';
import HorizontalRulePlugin from '../Lexical/Plugins/HorizontalRulePlugin';
import TwitterPlugin from '../Lexical/Plugins/TwitterPlugin';
import YouTubePlugin from '../Lexical/Plugins/YouTubePlugin';
import AutoEmbedPlugin from '../Lexical/Plugins/AutoEmbedPlugin';
import CollapsiblePlugin from '../Lexical/Plugins/CollapsiblePlugin';
import DraggableBlockPlugin from '../Lexical/Plugins/DraggableBlockPlugin';
import CodeHighlightPlugin from '../Lexical/Plugins/CodeHighlightPlugin';

const BlockDragEnabled = false;

type BlocksEditorProps = {
  onChange: (value: string) => void;
  className?: string;
  children: React.ReactNode;
};

export const BlocksEditor: FunctionComponent<BlocksEditorProps> = ({
  onChange,
  className,
  children,
}) => {
  const handleChange = useCallback(
    (editorState: EditorState, _editor: LexicalEditor) => {
      const stringifiedEditorState = JSON.stringify(editorState.toJSON());
      onChange(stringifiedEditorState);
    },
    [onChange],
  );

  const [floatingAnchorElem, setFloatingAnchorElem] =
    useState<HTMLDivElement | null>(null);

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  return (
    <>
      {children}
      <RichTextPlugin
        contentEditable={
          <div id="blocks-editor" className="editor-scroller">
            <div className="editor" ref={onRef}>
              <ContentEditable
                className={`ContentEditable__root ${className}`}
              />
            </div>
          </div>
        }
        placeholder=""
        ErrorBoundary={LexicalErrorBoundary}
      />
      <ListPlugin />
      <MarkdownShortcutPlugin
        transformers={[
          CHECK_LIST,
          ...ELEMENT_TRANSFORMERS,
          ...TEXT_FORMAT_TRANSFORMERS,
          ...TEXT_MATCH_TRANSFORMERS,
        ]}
      />
      <TablePlugin />
      <OnChangePlugin onChange={handleChange} />
      <HistoryPlugin />
      <HorizontalRulePlugin />
      <AutoFocusPlugin />
      <ClearEditorPlugin />
      <CheckListPlugin />
      <CodeHighlightPlugin />
      <LinkPlugin />
      <HashtagPlugin />
      <AutoEmbedPlugin />
      <TwitterPlugin />
      <YouTubePlugin />
      <CollapsiblePlugin />
      {floatingAnchorElem && BlockDragEnabled && (
        <>{<DraggableBlockPlugin anchorElem={floatingAnchorElem} />}</>
      )}
    </>
  );
};

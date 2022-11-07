import {FunctionComponent, useCallback} from 'react';
import {LexicalComposer} from '@lexical/react/LexicalComposer';
import {RichTextPlugin} from '@lexical/react/LexicalRichTextPlugin';
import {ContentEditable} from '@lexical/react/LexicalContentEditable';
import {OnChangePlugin} from '@lexical/react/LexicalOnChangePlugin';
import {AutoFocusPlugin} from '@lexical/react/LexicalAutoFocusPlugin';
import {CheckListPlugin} from '@lexical/react/LexicalCheckListPlugin';
import {ClearEditorPlugin} from '@lexical/react/LexicalClearEditorPlugin';
import {MarkdownShortcutPlugin} from '@lexical/react/LexicalMarkdownShortcutPlugin';
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
import {ListNode, ListItemNode} from '@lexical/list';
import {CodeHighlightNode, CodeNode} from '@lexical/code';
import {HashtagNode} from '@lexical/hashtag';
import {AutoLinkNode, LinkNode} from '@lexical/link';
import {HeadingNode, QuoteNode} from '@lexical/rich-text';
import {EditorState, LexicalEditor} from 'lexical';

import ComponentPickerMenuPlugin from '../Lexical/Plugins/ComponentPickerPlugin';
import BlocksEditorTheme from '../Lexical/Theme';

type BlocksEditorProps = {
  initialValue: string;
  onChange: (value: string) => void;
  className?: string;
};

export const BlocksEditor: FunctionComponent<BlocksEditorProps> = ({
  initialValue,
  onChange,
  className,
}) => {
  const handleChange = useCallback(
    (editorState: EditorState, _editor: LexicalEditor) => {
      const stringifiedEditorState = JSON.stringify(editorState.toJSON());
      onChange(stringifiedEditorState);
    },
    [onChange],
  );

  return (
    <LexicalComposer
      initialConfig={{
        namespace: 'MyEditor',
        theme: BlocksEditorTheme,
        onError: (error: Error) => console.error(error),
        editorState:
          initialValue && initialValue.length > 0 ? initialValue : undefined,
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
      }}>
      <RichTextPlugin
        contentEditable={
          <ContentEditable className={`ContentEditable__root ${className}`} />
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
      <OnChangePlugin onChange={handleChange} />
      <HistoryPlugin />
      <AutoFocusPlugin />
      <ComponentPickerMenuPlugin />
      <ClearEditorPlugin />
      <CheckListPlugin />
      <LinkPlugin />
      <HashtagPlugin />
    </LexicalComposer>
  );
};

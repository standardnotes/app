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
import {$getRoot, EditorState, LexicalEditor} from 'lexical';
import HorizontalRulePlugin from '../Lexical/Plugins/HorizontalRulePlugin';
import TwitterPlugin from '../Lexical/Plugins/TwitterPlugin';
import YouTubePlugin from '../Lexical/Plugins/YouTubePlugin';
import AutoEmbedPlugin from '../Lexical/Plugins/AutoEmbedPlugin';
import CollapsiblePlugin from '../Lexical/Plugins/CollapsiblePlugin';
import DraggableBlockPlugin from '../Lexical/Plugins/DraggableBlockPlugin';
import CodeHighlightPlugin from '../Lexical/Plugins/CodeHighlightPlugin';
import FloatingTextFormatToolbarPlugin from '../Lexical/Plugins/FloatingTextFormatToolbarPlugin';
import FloatingLinkEditorPlugin from '../Lexical/Plugins/FloatingLinkEditorPlugin';
import {truncateString} from './Utils';
import {SuperEditorContentId} from './Constants';
import {classNames} from '@standardnotes/utils';
import {EditorLineHeight} from '@standardnotes/snjs';

type BlocksEditorProps = {
  onChange: (value: string, preview: string) => void;
  className?: string;
  children?: React.ReactNode;
  previewLength: number;
  spellcheck?: boolean;
  ignoreFirstChange?: boolean;
  lineHeight: EditorLineHeight;
};

export const BlocksEditor: FunctionComponent<BlocksEditorProps> = ({
  onChange,
  className,
  children,
  previewLength,
  spellcheck,
  ignoreFirstChange = false,
  lineHeight,
}) => {
  const [didIgnoreFirstChange, setDidIgnoreFirstChange] = useState(false);
  const handleChange = useCallback(
    (editorState: EditorState, _editor: LexicalEditor) => {
      if (ignoreFirstChange && !didIgnoreFirstChange) {
        setDidIgnoreFirstChange(true);
        return;
      }

      editorState.read(() => {
        const childrenNodes = $getRoot().getAllTextNodes().slice(0, 2);
        let previewText = '';
        childrenNodes.forEach((node, index) => {
          previewText += node.getTextContent();
          if (index !== childrenNodes.length - 1) {
            previewText += '\n';
          }
        });
        previewText = truncateString(previewText, previewLength);

        try {
          const stringifiedEditorState = JSON.stringify(editorState.toJSON());
          onChange(stringifiedEditorState, previewText);
        } catch (error) {
          window.alert(
            `An invalid change was made inside the Super editor. Your change was not saved. Please report this error to the team: ${error}`,
          );
        }
      });
    },
    [onChange, didIgnoreFirstChange],
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
          <div id="blocks-editor" className="editor-scroller h-full">
            <div className="editor" ref={onRef}>
              <ContentEditable
                id={SuperEditorContentId}
                className={classNames(
                  'ContentEditable__root overflow-y-auto',
                  `leading-${lineHeight.toLowerCase()}`,
                  className,
                )}
                spellCheck={spellcheck}
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
      <OnChangePlugin onChange={handleChange} ignoreSelectionChange={true} />
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
      {floatingAnchorElem && (
        <>
          <FloatingTextFormatToolbarPlugin anchorElem={floatingAnchorElem} />
          <FloatingLinkEditorPlugin />
          <DraggableBlockPlugin anchorElem={floatingAnchorElem} />
        </>
      )}
    </>
  );
};

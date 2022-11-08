import {FunctionComponent} from 'react';
import {LexicalComposer} from '@lexical/react/LexicalComposer';
import BlocksEditorTheme from '../Lexical/Theme/Theme';
import {BlockEditorNodes} from '../Lexical/Nodes/AllNodes';
import {Klass, LexicalNode} from 'lexical';

type BlocksEditorComposerProps = {
  initialValue: string;
  children: React.ReactNode;
  nodes: Array<Klass<LexicalNode>>;
};

export const BlocksEditorComposer: FunctionComponent<
  BlocksEditorComposerProps
> = ({initialValue, children, nodes}) => {
  return (
    <LexicalComposer
      initialConfig={{
        namespace: 'BlocksEditor',
        theme: BlocksEditorTheme,
        onError: (error: Error) => console.error(error),
        editorState:
          initialValue && initialValue.length > 0 ? initialValue : undefined,
        nodes: [...nodes, ...BlockEditorNodes],
      }}>
      <>{children}</>
    </LexicalComposer>
  );
};

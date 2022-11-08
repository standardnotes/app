import {FunctionComponent} from 'react';
import {LexicalComposer} from '@lexical/react/LexicalComposer';
import BlocksEditorTheme from '../Lexical/Theme/Theme';
import {BlockEditorNodes} from '../Lexical/Nodes/AllNodes';

type BlocksEditorComposerProps = {
  initialValue: string;
  children: React.ReactNode;
};

export const BlocksEditorComposer: FunctionComponent<
  BlocksEditorComposerProps
> = ({initialValue, children}) => {
  return (
    <LexicalComposer
      initialConfig={{
        namespace: 'BlocksEditor',
        theme: BlocksEditorTheme,
        onError: (error: Error) => console.error(error),
        editorState:
          initialValue && initialValue.length > 0 ? initialValue : undefined,
        nodes: BlockEditorNodes,
      }}>
      <>{children}</>
    </LexicalComposer>
  );
};

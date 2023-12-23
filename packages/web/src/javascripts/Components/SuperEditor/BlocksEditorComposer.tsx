import { FunctionComponent } from 'react'
import { LexicalComposer, InitialEditorStateType } from '@lexical/react/LexicalComposer'
import BlocksEditorTheme from './Lexical/Theme/Theme'
import { BlockEditorNodes } from './Lexical/Nodes/AllNodes'
import { Klass, LexicalNode } from 'lexical'

type BlocksEditorComposerProps = {
  initialValue: InitialEditorStateType | undefined
  children: React.ReactNode
  nodes?: Array<Klass<LexicalNode>>
  readonly?: boolean
}

export const BlocksEditorComposer: FunctionComponent<BlocksEditorComposerProps> = ({
  initialValue,
  children,
  readonly,
  nodes = [],
}) => {
  return (
    <LexicalComposer
      initialConfig={{
        namespace: 'BlocksEditor',
        theme: BlocksEditorTheme,
        editable: !readonly,
        onError: (error: Error) => console.error(error),
        editorState: typeof initialValue === 'string' && initialValue.length === 0 ? undefined : initialValue,
        nodes: [...nodes, ...BlockEditorNodes],
      }}
    >
      <>{children}</>
    </LexicalComposer>
  )
}

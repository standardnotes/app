import { Spread } from 'lexical'
import { SerializedDecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode'

export type SerializedFileNode = Spread<
  {
    fileUuid: string
    version: 1
    type: 'snfile'
    zoomLevel: number
  },
  SerializedDecoratorBlockNode
>

import { Spread } from 'lexical'
import { SerializedDecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode'

export type SerializedFileNode = Spread<
  {
    fileUuid: string
    zoomLevel: number
  },
  SerializedDecoratorBlockNode
>

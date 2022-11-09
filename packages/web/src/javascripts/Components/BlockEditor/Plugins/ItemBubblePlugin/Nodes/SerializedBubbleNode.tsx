import { Spread } from 'lexical'
import { SerializedDecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode'

export type SerializedBubbleNode = Spread<
  {
    itemUuid: string
    version: 1
    type: 'snbubble'
  },
  SerializedDecoratorBlockNode
>
